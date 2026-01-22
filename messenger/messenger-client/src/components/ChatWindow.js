import React, { useState, useEffect, useCallback, useRef } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import ContextMenu from './ContextMenu';
import { getUserIdFromToken, getToken, getApiHost } from '../utils/auth';
import socketManager from '../utils/socketManager';
import VideoCall from './VideoCall';
import useTranslation from '../hooks/useTranslation';

const ChatWindow = ({ chat, theme, language }) => {
  const { t } = useTranslation(language);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [editingMessage, setEditingMessage] = useState(null);
  const [editInput, setEditInput] = useState('');
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, message: null });
  const [voiceContextMenu, setVoiceContextMenu] = useState({ visible: false, x: 0, y: 0, message: null });
  const [selectedFile, setSelectedFile] = useState(null);
  const [socket, setSocket] = useState(null);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingInterval, setRecordingInterval] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      return true;
    }
    return false;
  });
  const currentChatRef = useRef(null);

  // Получаем ID текущего пользователя
  const currentUserId = getUserIdFromToken();
  
  // Получаем имя текущего пользователя из localStorage
  const getCurrentUserName = () => {
    // Проверяем localStorage
    const storedName = localStorage.getItem('userName');
    
    // Если есть в localStorage, используем
    if (storedName) {
      return storedName;
    }
    
    // Пытаемся получить из сообщений
    const myMessages = messages.filter(msg => msg.sender.id === currentUserId);
    if (myMessages.length > 0) {
      const myName = myMessages[0].sender.name;
      if (myName) {
        localStorage.setItem('userName', myName);
        return myName;
      }
    }
    
    // Fallback
    return `User ${currentUserId}`;
  };

  const [currentUserName, setCurrentUserName] = useState(getCurrentUserName());

  // Пытаемся получить имя пользователя из сообщений
  useEffect(() => {
    const updateCurrentUserName = () => {
      // Проверяем localStorage
      const storedName = localStorage.getItem('userName');
      if (storedName) {
        setCurrentUserName(storedName);
        return;
      }
      
      // Ищем свое имя в сообщениях
      const myMessages = messages.filter(msg => msg.sender.id === currentUserId);
      if (myMessages.length > 0) {
        const myName = myMessages[0].sender.name;
        if (myName && myName !== currentUserName) {
          setCurrentUserName(myName);
          localStorage.setItem('userName', myName);
        }
      }
    };
    
    updateCurrentUserName();
  }, [messages, currentUserId, currentUserName]);

  const toggleNotifications = () => {
    if (!('Notification' in window)) {
      alert(t('chatWindow.browserNoNotifications'));
      return;
    }

    if (!notificationsEnabled) {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          setNotificationsEnabled(true);
        } else {
          alert(t('chatWindow.notificationsDenied'));
        }
      });
    } else {
      setNotificationsEnabled(false);
    }
  };

  const showNotification = (message) => {
    const voiceMessageText = message.text || t('chatWindow.voiceMessage');
    toast.success(t('chatWindow.newMessage', { name: message.sender.name, text: voiceMessageText }), {
      duration: 4000,
      icon: '💬',
      style: {
        background: '#4CAF50',
        color: '#fff',
      },
    });

    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          const notification = new Notification(
            `Message from ${message.sender.name}`,
            {
              body: message.text || 'New message',
              icon: '/favicon.ico',
              tag: `message-${message.id}`,
              requireInteraction: false,
              silent: false,
            }
          );

          setTimeout(() => {
            notification.close();
          }, 5000);

          notification.onclick = () => {
            window.focus();
            notification.close();
          };
        } catch (error) {
          // Игнорируем ошибки системных уведомлений
        }
      } else if (Notification.permission === 'default') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            setNotificationsEnabled(true);
            try {
              const notification = new Notification(
                `Message from ${message.sender.name}`,
                {
                  body: message.text || 'New message',
                  icon: '/favicon.ico',
                  tag: `message-${message.id}`,
                  requireInteraction: false,
                  silent: false,
                }
              );

              setTimeout(() => {
                notification.close();
              }, 5000);

              notification.onclick = () => {
                window.focus();
                notification.close();
              };
            } catch (error) {
              // Игнорируем ошибки системных уведомлений
            }
          }
        });
      }
    }

    playNotificationSound();
  };

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
          playTone(audioContext);
        });
      } else {
        playTone(audioContext);
      }
    } catch (error) {
      playFallbackSound();
    }
  };

  const playTone = (audioContext) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  const playFallbackSound = () => {
    try {
      const sampleRate = 44100;
      const duration = 0.3;
      const frequency = 800;
      const samples = sampleRate * duration;

      const buffer = new ArrayBuffer(44 + samples * 2);
      const view = new DataView(buffer);

      const writeString = (offset, string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };

      writeString(0, 'RIFF');
      view.setUint32(4, 36 + samples * 2, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 1, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      writeString(36, 'data');
      view.setUint32(40, samples * 2, true);

      for (let i = 0; i < samples; i++) {
        const sample = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.1;
        const intSample = Math.max(-32768, Math.min(32767, sample * 32768));
        view.setInt16(44 + i * 2, intSample, true);
      }

      const blob = new Blob([buffer], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);

      audio.volume = 0.3;
      audio.play().catch(console.error);

      audio.onended = () => URL.revokeObjectURL(url);
    } catch (error) {
      console.log('Fallback sound failed:', error);
    }
  };

  useEffect(() => {
    currentChatRef.current = chat;
  }, [chat]);

  useEffect(() => {
    setMessages([]);

    const fieldType = chat.type === 'contact' ? 'receiverUserId' : 'receiverChannelId';
    const queryString = new URLSearchParams({ [fieldType]: chat.id }).toString();

    const fetchMessages = async () => {
      try {
        const token = getToken();
        const apiHost = getApiHost();
        const response = await fetch(`https://${apiHost}/messages?` + queryString, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setMessages(data);
        } else {
          console.error('Failed to fetch messages:', response.status, await response.text());
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();
  }, [chat.id, chat.type]);

  useEffect(() => {
    const messagesDiv = document.querySelector('.messages');
    if (messagesDiv) {
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
  }, [messages]);

  const handleNewMessage = useCallback((msg) => {
    const currentChat = currentChatRef.current;
    if (!currentChat) return;
  
    const currentUserId = getUserIdFromToken();
    let shouldAddMessage = false;
  
    if (msg.receiverUser) {
      const isCurrentUserSender = msg.sender.id === currentUserId;
      const isCurrentUserReceiver = msg.receiverUser.id === currentUserId;
      const isChatWithSender = msg.sender.id === currentChat.id;
      const isChatWithReceiver = msg.receiverUser.id === currentChat.id;
  
      if ((isCurrentUserSender || isCurrentUserReceiver) && (isChatWithSender || isChatWithReceiver)) {
        shouldAddMessage = true;
      }
    }
  
    if (msg.receiverChannel) {
      if (msg.receiverChannel.id === currentChat.id) {
        shouldAddMessage = true;
      }
    }
  
    const isCurrentUserReceiver = msg.receiverUser && msg.receiverUser.id === currentUserId;
    const isCurrentChatWithSender = currentChat && currentChat.id === msg.sender.id;
  
    // Проверяем, не обрабатывали ли уже это сообщение
    const messageAlreadyExists = messages.some(existingMsg => existingMsg.id === msg.id);
    
    if (shouldAddMessage && !messageAlreadyExists) {
      setMessages(prev => {
        // Проверяем еще раз внутри setState
        const alreadyExists = prev.some(existingMsg => existingMsg.id === msg.id);
        if (alreadyExists) {
          return prev;
        }
        return [...prev, msg];
      });
    }
  
    // Показываем уведомление только если:
    // 1. Мы получатель
    // 2. Уведомления включены
    // 3. Не в чате с отправителем
    // 4. Сообщение еще не показывалось (не в текущих сообщениях)
    if (isCurrentUserReceiver && 
        notificationsEnabled && 
        !isCurrentChatWithSender && 
        !messageAlreadyExists) {
      showNotification(msg);
    }
  }, [notificationsEnabled, messages]);

  const acceptCall = useCallback((caller) => {
    setIncomingCall(null);
    setActiveCall({ 
      partnerId: caller.id, 
      partnerName: caller.name, 
      isInitiator: false,
      partner: caller
    });
    setShowVideoCall(true);
    socketManager.acceptCall(caller.id);
  }, []);

  const rejectCall = useCallback((caller) => {
    setIncomingCall(null);
    socketManager.rejectCall(caller.id);
  }, []);

  const endCall = useCallback(() => {
    if (activeCall) {
      socketManager.endCall(activeCall.partnerId);
      setActiveCall(null);
    }
    setShowVideoCall(false);
    setIncomingCall(null);
  }, [activeCall]);

  const handleIncomingCall = useCallback((data) => {
    const caller = data.caller || data;

    if (activeCall) {
      socketManager.rejectCall(caller.id);
      toast.error(t('chatWindow.alreadyInCall', { name: caller.name }));
      return;
    }

    setIncomingCall(caller);

    toast((dismissToast) => (
      <div>
        <strong>📞 {t('chatWindow.incomingVideoCall')}</strong>
        <p>{t('chatWindow.from')}: {caller.name}</p>
        <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
          <button
            onClick={() => {
              acceptCall(caller);
              toast.dismiss(dismissToast.id);
            }}
            style={{
              padding: '5px 15px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            ✅ {t('chatWindow.accept')}
          </button>
          <button
            onClick={() => {
              rejectCall(caller);
              toast.dismiss(dismissToast.id);
            }}
            style={{
              padding: '5px 15px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            ❌ {t('chatWindow.reject')}
          </button>
        </div>
      </div>
    ), {
      duration: 30000,
      style: {
        background: '#2196F3',
        color: '#fff'
      }
    });
  }, [activeCall, acceptCall, rejectCall, t]);

  useEffect(() => {
    const handleCallAccepted = (data) => {
      console.log('Call accepted data:', data);
      // Проверяем, что это действительно call-accepted, а не ICE кандидат
      if (data.answer || (data.from && !data.candidate)) {
        if (activeCall?.isInitiator && data.from === activeCall.partnerId) {
          toast.success(t('chatWindow.callAccepted'), {
            icon: '✅',
            duration: 2000,
          });
          setActiveCall(prev => ({ ...prev, isAccepted: true }));
        }
      }
    };

    const handleCallRejected = (data) => {
      console.log('Call rejected data:', data);
      if (activeCall?.isInitiator && data.from === activeCall.partnerId) {
        setActiveCall(null);
        setShowVideoCall(false);
        toast.error(t('chatWindow.callRejected'), {
          icon: '❌',
          duration: 3000,
        });
      }
    };

    const handleCallEnded = (data) => {
      console.log('Call ended data:', data);
      if (data?.from === activeCall?.partnerId) {
        setActiveCall(null);
        setShowVideoCall(false);
        setIncomingCall(null);
        toast(t('chatWindow.callEnded'), {
          icon: '📵',
          duration: 3000,
        });
      }
    };

    // Регистрируем обработчики ТОЛЬКО ОДИН РАЗ
    socketManager.addCallRequestHandler(handleIncomingCall);
    socketManager.addCallAcceptedHandler(handleCallAccepted);
    socketManager.addCallRejectedHandler(handleCallRejected);
    socketManager.addCallEndedHandler(handleCallEnded);

    return () => {
      // Очищаем обработчики при размонтировании
      socketManager.removeCallRequestHandler(handleIncomingCall);
      socketManager.removeCallAcceptedHandler(handleCallAccepted);
      socketManager.removeCallRejectedHandler(handleCallRejected);
      socketManager.removeCallEndedHandler(handleCallEnded);
    };
  }, [activeCall, handleIncomingCall, t]);
  
  const handleMessageUpdate = useCallback((updatedMessage) => {
    setMessages(prev =>
      prev.map(msg => msg.id === updatedMessage.id ? { ...msg, ...updatedMessage } : msg)
    );
  }, []);

  const handleMessageDelete = useCallback((deleteData) => {
    setMessages(prevMessages => {
      const messageExists = prevMessages.some(msg => msg.id === deleteData.id);
      if (!messageExists) {
        return prevMessages;
      }
      return prevMessages.filter(msg => msg.id !== deleteData.id);
    });
  }, []);

  useEffect(() => {
    const socket = socketManager.connect();
    setSocket(socket);

    socketManager.addMessageHandler(handleNewMessage);
    socketManager.addUpdateHandler(handleMessageUpdate);
    socketManager.addDeleteHandler(handleMessageDelete);

    // Обработчики событий каналов
    const handleChannelUpdated = (updatedChannel) => {
      if (chat.type === 'channel' && chat.id === updatedChannel.id) {
        toast(t('chatWindow.channelUpdated', { name: updatedChannel.name }), {
          duration: 5000,
          icon: '📝',
          style: {
            background: '#2196F3',
            color: '#fff',
          },
        });
      }
    };

    const handleChannelDeleted = (data) => {
      if (chat.type === 'channel' && chat.id === data.id) {
        toast(t('chatWindow.channelDeleted'), {
          duration: 10000,
          icon: '⚠️',
          style: {
            background: '#f44336',
            color: '#fff',
          },
        });
        // Можно автоматически переключить на другой канал или контакты
        // Здесь можно добавить логику для автоматического переключения
      }
    };

    socket.on('channel-updated', handleChannelUpdated);
    socket.on('channel-deleted', handleChannelDeleted);

    return () => {
      socketManager.removeMessageHandler(handleNewMessage);
      socketManager.removeUpdateHandler(handleMessageUpdate);
      socketManager.removeDeleteHandler(handleMessageDelete);
      socket.off('channel-updated', handleChannelUpdated);
      socket.off('channel-deleted', handleChannelDeleted);
    };
  }, [chat.id, chat.type, language]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
        alert(t('chatWindow.audioNotSupported'));
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert(t('chatWindow.fileTooLarge'));
        return;
      }
      setSelectedFile(file);
    }
  };

  const sendMessage = async () => {
    if (input.trim() === '' && !selectedFile) return;

    const fieldType = chat.type === 'contact' ? 'receiverUserId' : 'receiverChannelId';
    const formData = new FormData();
    formData.append(fieldType, chat.id);
    if (input.trim() !== '') formData.append('text', input);
    if (selectedFile) formData.append('file', selectedFile);

    try {
      const token = getToken();
      const apiHost = getApiHost();
      const response = await fetch(`https://${apiHost}/messages`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        setInput('');
        setSelectedFile(null);
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = '';
      } else {
        const errorText = await response.text();
        console.error('Failed to send message:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  const handleContextMenu = (e, message) => {
    e.preventDefault();
    if (message.sender.id === getUserIdFromToken()) {
      setContextMenu({ visible: true, x: e.pageX, y: e.pageY, message });
    }
  };

  const handleDelete = () => {
    if (contextMenu.message) {
      deleteMessage(contextMenu.message.id);
      setContextMenu({ ...contextMenu, visible: false });
    }
  };

  const handleEdit = () => {
    if (contextMenu.message) {
      setEditingMessage(contextMenu.message);
      setEditInput(contextMenu.message.text);
      setContextMenu({ ...contextMenu, visible: false });
    }
  };

  const handleVoiceContextMenu = (e, message) => {
    e.preventDefault();
    if (message.sender.id === getUserIdFromToken()) {
      setVoiceContextMenu({ visible: true, x: e.pageX, y: e.pageY, message });
    }
  };

  const handleVoiceDelete = () => {
    if (voiceContextMenu.message) {
      deleteMessage(voiceContextMenu.message.id);
      setVoiceContextMenu({ ...voiceContextMenu, visible: false });
    }
  };

  const handleVoiceDownload = () => {
    if (voiceContextMenu.message && voiceContextMenu.message.fileUrl) {
      const apiHost = getApiHost();
      const link = document.createElement('a');
      link.href = `https://${apiHost}${voiceContextMenu.message.fileUrl}`;
      link.download = `voice-message-${voiceContextMenu.message.id}.webm`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setVoiceContextMenu({ ...voiceContextMenu, visible: false });

      toast.success(t('chatWindow.voiceDownloaded'), {
        icon: '⬇️',
        duration: 2000,
      });
    }
  };

  const handleVoiceChangeSpeed = () => {
    if (voiceContextMenu.message) {
      // Находим audio элемент для этого голосового сообщения
      const audioElement = document.querySelector(`audio[data-message-id="${voiceContextMenu.message.id}"]`);
      if (audioElement) {
        // Циклически меняем скорость воспроизведения: 1x -> 1.5x -> 2x -> 0.5x -> 1x
        const currentRate = audioElement.playbackRate;
        let newRate;
        if (currentRate === 1) newRate = 1.5;
        else if (currentRate === 1.5) newRate = 2;
        else if (currentRate === 2) newRate = 0.5;
        else newRate = 1;

        audioElement.playbackRate = newRate;

        toast.success(t('chatWindow.playbackSpeed', { speed: newRate }), {
          icon: '⚡',
          duration: 2000,
        });
      }
      setVoiceContextMenu({ ...voiceContextMenu, visible: false });
    }
  };

  const closeContextMenu = () => {
    setContextMenu({ ...contextMenu, visible: false });
    setVoiceContextMenu({ ...voiceContextMenu, visible: false });
  };

  const deleteMessage = async (messageId) => {
    try {
      const token = getToken();
      const apiHost = getApiHost();
      const response = await fetch(`https://${apiHost}/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Failed to delete message:', response.status, await response.text());
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const updateMessage = async () => {
    if (editingMessage) {
      try {
        const token = getToken();
        const apiHost = getApiHost();
        const response = await fetch(`https://${apiHost}/messages/${editingMessage.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: editInput }),
        });

        if (response.ok) {
          setEditingMessage(null);
          setEditInput('');
        } else {
          console.error('Failed to update message:', response.status, await response.text());
        }
      } catch (error) {
        console.error('Error updating message:', error);
      }
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType.includes('image/')) return <span role="img" aria-label="image">🖼️</span>;
    if (fileType.includes('pdf')) return <span role="img" aria-label="PDF">📄</span>;
    if (fileType.includes('word') || fileType.includes('document')) return <span role="img" aria-label="Word">📝</span>;
    if (fileType.includes('sheet') || fileType.includes('excel')) return <span role="img" aria-label="Spreadsheet">📊</span>;
    if (fileType.includes('zip') || fileType.includes('rar')) return <span role="img" aria-label="Archive">📦</span>;
    return <span role="img" aria-label="Attachment">📎</span>;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString(language === 'ru' ? 'ru-RU' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const highlightSearchText = (text, query) => {
    if (!query || !text) return text;

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="search-highlight">{part}</mark>
      ) : (
        part
      )
    );
  };

  const renderMessage = (message) => (
    <div
      key={message.id}
      id={`message-${message.id}`}
      className={`message ${message.sender.id === getUserIdFromToken() ? 'sent' : 'received'} ${
        searchResults.some(result => result.message.id === message.id) ? 'search-result' : ''
      }`}
      onContextMenu={(e) => handleContextMenu(e, message)}
    >
      <div className="message-header">
        <strong className="sender-name">{message.sender.name}</strong>
        <span className="message-time">{formatMessageTime(message.created_at)}</span>
      </div>

      {message.text && (
        <div className="message-text">
          {highlightSearchText(message.text, searchQuery)}
        </div>
      )}

      {message.messageType === 'voice' && message.fileUrl && (
        <div
          className="message-voice"
          onContextMenu={(e) => handleVoiceContextMenu(e, message)}
        >
          <div className="voice-info">
            <span className="voice-icon">🎵</span>
            <span className="voice-duration">
              {message.duration
                ? `${message.duration} ${t('chatWindow.seconds')}`
                : t('chatWindow.voiceMessage')
              }
            </span>
          </div>
          <audio
            controls
            className="voice-player-fullwidth"
            data-message-id={message.id}
            preload="none"
            style={{
              width: '100%',
              marginTop: '8px',
              borderRadius: '4px',
            }}
          >
            <source
              src={`https://${getApiHost()}${message.fileUrl}`}
              type={message.fileType || 'audio/webm'}
            />
            {language === 'ru'
              ? 'Ваш браузер не поддерживает воспроизведение аудио.'
              : 'Your browser does not support audio playback.'
            }
          </audio>
        </div>
      )}

      {message.fileUrl && message.messageType !== 'voice' && (
        <div className="message-file">
          <div className="file-info">
            <span className="file-icon">{getFileIcon(message.fileType)}</span>
            <span className="file-name" title={message.fileName}>{message.fileName}</span>
            <span className="file-size">{formatFileSize(message.fileSize)}</span>
            <a
              href={`https://${getApiHost()}${message.fileUrl}`}
              download={message.fileName}
              className="download-button"
            >
              {t('chatWindow.download')}
            </a>
          </div>
        </div>
      )}
    </div>
  );

  const startVideoCall = () => {
    if (activeCall) {
      toast.error(t('chatWindow.alreadyInCall', { name: '' }));
      return;
    }

    if (chat.id === getUserIdFromToken()) {
      toast.error(t('chatWindow.cannotCallYourself'));
      return;
    }

    const newCall = {
      partnerId: chat.id,
      partnerName: chat.name,
      isInitiator: true,
      partner: chat
    };

    setActiveCall(newCall);
    setShowVideoCall(true);

    socketManager.requestCall(chat.id, chat.name);

    toast(t('chatWindow.calling', { name: chat.name }), {
      icon: '📞',
      duration: 3000,
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

      const chunks = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        setRecordedChunks(chunks);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingDuration(0);

      const interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      setRecordingInterval(interval);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert(t('chatWindow.recordingError'));
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      if (recordingInterval) {
        clearInterval(recordingInterval);
        setRecordingInterval(null);
      }
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setCurrentSearchIndex(-1);
      return;
    }

    const results = messages
      .map((message, index) => ({ message, index }))
      .filter(({ message }) =>
        message.text && message.text.toLowerCase().includes(query.toLowerCase())
      );

    setSearchResults(results);
    setCurrentSearchIndex(results.length > 0 ? 0 : -1);
  };

  const navigateSearch = (direction) => {
    if (searchResults.length === 0) return;

    let newIndex;
    if (direction === 'next') {
      newIndex = currentSearchIndex < searchResults.length - 1 ? currentSearchIndex + 1 : 0;
    } else {
      newIndex = currentSearchIndex > 0 ? currentSearchIndex - 1 : searchResults.length - 1;
    }

    setCurrentSearchIndex(newIndex);

    const messageElement = document.getElementById(`message-${searchResults[newIndex].message.id}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      messageElement.style.backgroundColor = 'rgba(0, 123, 255, 0.1)';
      setTimeout(() => {
        messageElement.style.backgroundColor = '';
      }, 2000);
    }
  };

  const closeSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    setCurrentSearchIndex(-1);
  };

  const sendVoiceMessage = async () => {
    if (recordedChunks.length === 0) return;

    const audioBlob = new Blob(recordedChunks, { type: 'audio/webm' });
    const audioFile = new File([audioBlob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });

    const fieldType = chat.type === 'contact' ? 'receiverUserId' : 'receiverChannelId';
    const formData = new FormData();
    formData.append(fieldType, chat.id);
    formData.append('file', audioFile);
    formData.append('messageType', 'voice');
    formData.append('duration', recordingDuration.toString());

    try {
      const token = getToken();
      const apiHost = getApiHost();
      const response = await fetch(`https://${apiHost}/messages`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        setRecordedChunks([]);
        setRecordingDuration(0);
      } else {
        console.error('Failed to send voice message:', response.status, await response.text());
      }
    } catch (error) {
      console.error('Error sending voice message:', error);
    }
  };

  return (
    <div className={`chat-window ${theme}`} onClick={(e) => {
      closeContextMenu();
      if (isSearchOpen && !e.target.closest('.search-bar') && !e.target.closest('.search-button')) {
        closeSearch();
      }
    }}>
      <div className="chat-header">
        <h2>{chat.name}</h2>
        <div className="chat-actions">
          <button
            className="search-button"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            title={t('chatWindow.searchMessages')}
          >
            🔍
          </button>
          <button
            className={`notification-button ${notificationsEnabled ? 'enabled' : 'disabled'}`}
            onClick={toggleNotifications}
            title={notificationsEnabled ? t('chatWindow.disableNotifications') : t('chatWindow.enableNotifications')}
          >
            🔔
          </button>
          {chat.type === 'contact' && (
            <button
              onClick={incomingCall ? () => acceptCall(incomingCall) : startVideoCall}
              title={incomingCall ? t('chatWindow.acceptVideoCall') : t('chatWindow.videoCall')}
              style={{
                backgroundColor: incomingCall ? '#4CAF50' : activeCall ? '#2196F3' : '#666',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px'
              }}
            >
              {incomingCall ? '📞' : activeCall ? '📹' : '📹'}
            </button>
          )}
        </div>
      </div>

      {isSearchOpen && (
        <div className="search-bar">
          <input
            type="text"
            placeholder={t('chatWindow.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="search-input"
            autoFocus
          />
          {searchResults.length > 0 && (
            <div className="search-navigation">
              <span className="search-count">
                {t('chatWindow.searchCount', { current: currentSearchIndex + 1, total: searchResults.length })}
              </span>
              <button
                onClick={() => navigateSearch('prev')}
                disabled={searchResults.length <= 1}
                className="nav-button"
              >
                ▲
              </button>
              <button
                onClick={() => navigateSearch('next')}
                disabled={searchResults.length <= 1}
                className="nav-button"
              >
                ▼
              </button>
            </div>
          )}
          <button onClick={closeSearch} className="close-search">
            ✕
          </button>
        </div>
      )}

      {showVideoCall && socket && activeCall && (
        <div className="video-call-wrapper">
          <VideoCall
            socket={socket}
            onEndCall={endCall}
            isInitiator={activeCall.isInitiator}
            remoteUser={activeCall.partner}
            localUser={{
              id: getUserIdFromToken(),
              name: currentUserName
            }}
            language={language}
          />
        </div>
      )}

      <div className="messages" style={{ overflowY: 'auto', flexGrow: 1 }}>
        {messages.map(renderMessage)}
      </div>

      {contextMenu.visible && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onDelete={handleDelete}
          onEdit={handleEdit}
          language={language}
          resourse='message'
        />
      )}

      {voiceContextMenu.visible && (
        <ContextMenu
          x={voiceContextMenu.x}
          y={voiceContextMenu.y}
          onDelete={handleVoiceDelete}
          onDownload={handleVoiceDownload}
          onChangeSpeed={handleVoiceChangeSpeed}
          language={language}
          resourse='voice'
        />
      )}

      {editingMessage && (
        <div className="modal">
          <div className="modal-content">
            <input
              type="text"
              value={editInput}
              onChange={(e) => setEditInput(e.target.value)}
            />
            <button onClick={updateMessage}>{t('chatWindow.save')}</button>
            <button onClick={() => setEditingMessage(null)}>{t('chatWindow.cancel')}</button>
          </div>
        </div>
      )}

      <div className="message-input">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('chatWindow.enterMessage')}
            style={{ flex: 1 }}
          />
          <input
            type="file"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            id="file-input"
          />
          <button className="attach-file" onClick={() => document.getElementById('file-input').click()}>
            <span role="img" aria-label={t('chatWindow.attachFile')}>📎</span>
          </button>
          <button
            className={`voice-record ${isRecording ? 'recording' : ''}`}
            onClick={isRecording ? stopRecording : startRecording}
            title={isRecording ? t('chatWindow.stopRecording') : t('chatWindow.startRecording')}
          >
            <span role="img" aria-label="Voice record">
              {isRecording ? '⏹️' : '🎤'}
            </span>
            {isRecording && <span className="recording-duration">{recordingDuration}s</span>}
          </button>
          <button onClick={sendMessage} disabled={isRecording}>
            {t('chatWindow.send')}
          </button>
          {recordedChunks.length > 0 && (
            <button onClick={sendVoiceMessage} className="send-voice">
              {t('chatWindow.sendVoiceMessage')} ({recordingDuration}s)
            </button>
          )}
        </div>

        {selectedFile && (
          <div className="selected-file">
            <span className="file-icon">{getFileIcon(selectedFile.type)}</span>
            <span className="file-name">{selectedFile.name}</span>
            <span className="file-size">{formatFileSize(selectedFile.size)}</span>
          </div>
        )}

        {recordedChunks.length > 0 && (
          <div className="recorded-voice">
            <span className="voice-icon">🎵</span>
            <span className="voice-info">
              {t('chatWindow.voiceMessageInfo', { duration: recordingDuration })}
            </span>
            <button onClick={() => setRecordedChunks([])} className="cancel-voice">
              ✕
            </button>
          </div>
        )}
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#4CAF50',
            color: '#fff',
          },
        }}
      />
    </div>
  );
};

export default ChatWindow;
