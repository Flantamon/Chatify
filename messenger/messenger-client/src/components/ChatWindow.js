import React, { useState, useEffect } from 'react';
import ContextMenu from './ContextMenu';
import { getUserIdFromToken, getToken } from '../utils/auth';
import io from 'socket.io-client';
import VideoCall from './VideoCall';

const ChatWindow = ({ chat, theme }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [editingMessage, setEditingMessage] = useState(null);
  const [editInput, setEditInput] = useState('');
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, message: null });
  const [selectedFile, setSelectedFile] = useState(null);
  const [socket, setSocket] = useState(null);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [roomId, setRoomId] = useState(null);

  // Получение сообщений
  useEffect(() => {
    const fieldType = chat.type === 'contact' ? 'receiverUserId' : 'receiverChannelId';
    const queryString = new URLSearchParams({ [fieldType]: chat.id }).toString();

    const fetchMessages = async () => {
      try {
        const token = getToken();
        const response = await fetch(`https://${process.env.REACT_APP_USER_CLIENT_HOST}/messages?` + queryString, {
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

  useEffect(() => {
    const newSocket = io(`wss://${process.env.REACT_APP_USER_CLIENT_HOST}`, {
      transports: ['websocket'],
      rejectUnauthorized: false
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to Socket.IO server, ID:', newSocket.id);
      const currentUserId = getUserIdFromToken();
      if (currentUserId) {
        newSocket.emit('join', String(currentUserId));
      }
    });

    newSocket.on('new-message', (msg) => {
      if (msg.receiverUser) {
        if (msg.receiverUser.id === chat.id || msg.sender.id === chat.id) {
          setMessages(prev => [...prev, msg]);
        }
      }
      if (msg.receiverChannel) {
        if (msg.receiverChannel.id === chat.id) {
          setMessages(prev => [...prev, msg]);
        }
      }
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket.IO connection error:', err);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected from Socket.IO server:', reason);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [chat.id]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
        alert('Аудио и видео файлы не поддерживаются');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('Размер файла не должен превышать 10MB');
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
      const response = await fetch(`https://${process.env.REACT_APP_USER_CLIENT_HOST}/messages`, {
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

  const closeContextMenu = () => {
    setContextMenu({ ...contextMenu, visible: false });
  };

  const deleteMessage = async (messageId) => {
    try {
      const token = getToken();
      const response = await fetch(`https://${process.env.REACT_APP_USER_CLIENT_HOST}/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setMessages(messages.filter(msg => msg.id !== messageId));
      } else {
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
        const response = await fetch(`https://${process.env.REACT_APP_USER_CLIENT_HOST}/messages/${editingMessage.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: editInput }),
        });

        if (response.ok) {
          const updatedMessage = await response.json();
          setMessages(messages.map(msg => (msg.id === updatedMessage.id ? updatedMessage : msg)));
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
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderMessage = (message) => (
    <div
      key={message.id}
      className={`message ${message.sender.id === getUserIdFromToken() ? 'sent' : 'received'}`}
      onContextMenu={(e) => handleContextMenu(e, message)}
    >
      <div className="message-header">
        <strong className="sender-name">{message.sender.name}</strong>
        <span className="message-time">{formatMessageTime(message.created_at)}</span>
      </div>

      {message.text && <div className="message-text">{message.text}</div>}

      {message.file_url && (
        <div className="message-file">
          <div className="file-info">
            <span className="file-icon">{getFileIcon(message.file_type)}</span>
            <span className="file-name" title={message.file_name}>{message.file_name}</span>
            <span className="file-size">{formatFileSize(message.file_size)}</span>
            <a
              href={`https://${process.env.REACT_APP_USER_CLIENT_HOST}/${message.file_url}`}
              download={message.file_name}
              className="download-button"
            >
              Скачать
            </a>
          </div>
        </div>
      )}
    </div>
  );

  const handleResetVideoCall = () => {
    setShowVideoCall(false);
    setRoomId(null);
  };

  const startVideoCall = () => {
    // Для уникальности комнаты можно взять chat.id + текущий timestamp (или другой способ)
    const newRoomId = `room-${chat.id}-${Date.now()}`;
    setRoomId(newRoomId);
    setShowVideoCall(true);
  };

  return (
    <div className={`chat-window ${theme}`} onClick={closeContextMenu}>
      <h2>{chat.name}</h2>
      <button onClick={startVideoCall}>
        Начать видеозвонок 
        <span role="img" aria-label="Video call"> 📞</span> 
      </button>

      {showVideoCall && socket && roomId && (
        <div className="video-call-wrapper">
          <VideoCall socket={socket} roomId={roomId} />
          <button onClick={handleResetVideoCall}>Завершить звонок</button>
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
            <button onClick={updateMessage}>Сохранить</button>
            <button onClick={() => setEditingMessage(null)}>Отмена</button>
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
            placeholder="Введите сообщение..."
            style={{ flex: 1 }}
          />
          <input
            type="file"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            id="file-input"
          />
          <button className="attach-file" onClick={() => document.getElementById('file-input').click()}>
            <span role="img" aria-label="Attach file">📎</span>
          </button>
          <button onClick={sendMessage}>Отправить</button>
        </div>

        {selectedFile && (
          <div className="selected-file">
            <span className="file-icon">{getFileIcon(selectedFile.type)}</span>
            <span className="file-name">{selectedFile.name}</span>
            <span className="file-size">{formatFileSize(selectedFile.size)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;
