import React, { useEffect, useRef, useState, useCallback } from 'react';
import useTranslation from '../hooks/useTranslation';

const VideoCall = ({ socket, onEndCall, isInitiator = false, remoteUser, localUser, language = 'ru' }) => {
  const { t } = useTranslation(language);
  console.log('VideoCall component rendered with:', { remoteUser, localUser, isInitiator });

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callStatus, setCallStatus] = useState(isInitiator ? 'calling' : 'connecting');
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [callStarted, setCallStarted] = useState(false);
  const [devices, setDevices] = useState({ video: [], audio: [] });
  const [selectedVideoDevice, setSelectedVideoDevice] = useState('');
  const [selectedAudioDevice, setSelectedAudioDevice] = useState('');
  const [showDeviceSettings, setShowDeviceSettings] = useState(false);
  
  const processedMessages = useRef({
    offers: new Set(),
    answers: new Set(),
    iceCandidates: new Set()
  });

  const config = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      }
    ]
  };

  const initMedia = useCallback(async () => {
    try {
      // Используем выбранные устройства, если они есть
      const constraints = {
        video: selectedVideoDevice ? {
          width: 640,
          height: 480,
          deviceId: { exact: selectedVideoDevice }
        } : {
          width: 640,
          height: 480
        },
        audio: selectedAudioDevice ? {
          deviceId: { exact: selectedAudioDevice }
        } : true
      };

      console.log('Requesting media with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      console.log('Local stream obtained, id:', stream.id);
      console.log('Local stream tracks:', stream.getTracks().map(t => ({ kind: t.kind, id: t.id })));
      console.log('Video device used:', stream.getVideoTracks()[0]?.getSettings()?.deviceId);
      console.log('Audio device used:', stream.getAudioTracks()[0]?.getSettings()?.deviceId);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error('Error accessing media devices:', err);
      setError('Не удалось получить доступ к камере/микрофону');
      onEndCall();
      throw err;
    }
  }, [onEndCall, selectedVideoDevice, selectedAudioDevice]);

  const createPeerConnection = useCallback(() => {
    try {
      const pc = new RTCPeerConnection(config);

      pc.onicecandidate = (event) => {
        console.log('ICE candidate event:', event.candidate ? 'has candidate' : 'no candidate');
        if (event.candidate && remoteUser?.id) {
          const candidateKey = `${event.candidate.candidate}-${Date.now()}`;
          if (!processedMessages.current.iceCandidates.has(candidateKey)) {
            processedMessages.current.iceCandidates.add(candidateKey);
            console.log('Sending ICE candidate to:', remoteUser.id, event.candidate);
            socket.emit('ice-candidate', {
              candidate: event.candidate,
              to: remoteUser.id,
              from: localUser?.id
            });
          }
        } else if (!event.candidate) {
          console.log('ICE gathering complete');
        }
      };

      pc.ontrack = (event) => {
        console.log('Received remote track:', event.track.kind, event.track.id);
        console.log('Remote streams:', event.streams);
        console.log('Remote streams[0] id:', event.streams[0]?.id);
        console.log('Local stream id:', localStream?.id);

        if (event.streams && event.streams[0]) {
          const remoteStream = event.streams[0];
          console.log('Setting remote video stream, stream id:', remoteStream.id);
          console.log('Remote stream tracks:', remoteStream.getTracks().map(t => ({ kind: t.kind, id: t.id })));

          // Проверяем, что это не наш локальный стрим
          if (localStream && remoteStream.id === localStream.id) {
            console.warn('WARNING: Remote stream has same ID as local stream! This might be a loopback issue.');
            return;
          }

          // Дополнительная проверка: убеждаемся, что треки действительно удаленные
          const remoteVideoTracks = remoteStream.getVideoTracks();
          const remoteAudioTracks = remoteStream.getAudioTracks();

          if (remoteVideoTracks.length === 0 && remoteAudioTracks.length === 0) {
            console.warn('WARNING: Remote stream has no tracks!');
            return;
          }

          // Проверяем, что хотя бы один трек активен
          const hasActiveTrack = [...remoteVideoTracks, ...remoteAudioTracks].some(track => track.readyState === 'live');
          if (!hasActiveTrack) {
            console.warn('WARNING: Remote stream has no active tracks!');
            return;
          }

          console.log('Remote stream validation passed. Setting remote video stream.');
          setRemoteStream(remoteStream);
          setIsConnected(true);
          setCallStatus('connected');
        } else {
          console.log('No remote streams in track event');
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', pc.iceConnectionState);
        switch(pc.iceConnectionState) {
          case 'connected':
          case 'completed':
            setCallStatus('connected');
            setIsConnected(true);
            break;
          case 'failed':
            setError('Ошибка подключения');
            break;
          case 'disconnected':
            setError('Соединение потеряно');
            break;
          case 'closed':
            onEndCall();
            break;
        }
      };

      pc.onsignalingstatechange = () => {
        console.log('Signaling state:', pc.signalingState);
      };

      return pc;
    } catch (err) {
      console.error('Error creating peer connection:', err);
      setError('Ошибка создания соединения');
      throw err;
    }
  }, [socket, remoteUser, localUser, onEndCall]);

  const startCall = useCallback(async () => {
    if (callStarted) {
      console.log('Call already started, skipping startCall');
      return;
    }
    setCallStarted(true);

    try {
      console.log('Starting call as initiator to:', remoteUser?.id);

      const stream = await initMedia();
      const pc = createPeerConnection();

      // Добавляем локальные треки
      stream.getTracks().forEach(track => {
        console.log('Adding local track:', track.kind, track.id);
        pc.addTrack(track, stream);
      });

      peerConnectionRef.current = pc;

      // Создаем offer
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });

      await pc.setLocalDescription(offer);

      const offerKey = `offer-${remoteUser?.id}-${offer.sdp?.substring(0, 100)}`;
      if (!processedMessages.current.offers.has(offerKey)) {
        processedMessages.current.offers.add(offerKey);
        console.log('Sending offer to:', remoteUser?.id);
        socket.emit('offer', {
          offer,
          to: remoteUser?.id,
          from: localUser?.id
        });
      }

      setCallStatus('waiting');
    } catch (err) {
      console.error('Error starting call:', err);
      setError('Ошибка при установке соединения');
      onEndCall();
    }
  }, [initMedia, createPeerConnection, socket, remoteUser, localUser, onEndCall, callStarted]);


  const handleAnswer = useCallback(async (data) => {
    console.log('Received answer from:', data.from, 'current signalingState:', peerConnectionRef.current?.signalingState);
    const pc = peerConnectionRef.current;
    if (!pc) {
      console.error('No peer connection when receiving answer');
      return;
    }

    if (data.from !== remoteUser?.id) {
      return;
    }

    const answerKey = `answer-${data.from}-${data.answer?.sdp?.substring(0, 100)}`;
    if (processedMessages.current.answers.has(answerKey)) {
      console.log('Duplicate answer ignored');
      return;
    }
    processedMessages.current.answers.add(answerKey);

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      console.log('Remote description set successfully, new signalingState:', pc.signalingState);
      setCallStatus('connected');
    } catch (err) {
      if (err.name === 'InvalidStateError' && err.message.includes('stable')) {
        console.log('Remote description already set, ignoring duplicate answer');
      } else {
        console.error('Error setting remote description for answer:', err);
      }
    }
  }, [remoteUser]);

  const handleOffer = useCallback(async (data) => {
    const offerKey = `offer-${data.from}-${data.offer?.sdp?.substring(0, 100)}`;
    if (processedMessages.current.offers.has(offerKey)) {
      console.log('Duplicate offer ignored');
      return;
    }
    processedMessages.current.offers.add(offerKey);

    console.log('Received offer from:', data.from);
    
    if (data.from === remoteUser?.id) {
      try {
        const stream = await initMedia();
        const pc = createPeerConnection();
        
        // Добавляем локальные треки
        stream.getTracks().forEach(track => {
          console.log('Adding local track:', track.kind, track.id);
          pc.addTrack(track, stream);
        });


        peerConnectionRef.current = pc;

        // Устанавливаем удаленное описание (offer)
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));

        // Создаем answer
        const answer = await pc.createAnswer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true
        });
        
        await pc.setLocalDescription(answer);

        const answerKey = `answer-${data.from}-${answer.sdp?.substring(0, 100)}`;
        if (!processedMessages.current.answers.has(answerKey)) {
          processedMessages.current.answers.add(answerKey);
          console.log('Sending answer to:', data.from);
          socket.emit('answer', {
            answer,
            to: data.from,
            from: localUser?.id
          });
        }

        setCallStatus('connecting');
      } catch (err) {
        console.error('Error handling offer:', err);
        setError('Ошибка при принятии звонка');
        onEndCall();
      }
    }
  }, [initMedia, createPeerConnection, socket, remoteUser, localUser, onEndCall]);

  const handleIceCandidate = useCallback(async (data) => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    if (data.from !== remoteUser?.id) {
      return;
    }

    const candidateKey = `ice-${data.candidate?.candidate}`;
    if (processedMessages.current.iceCandidates.has(candidateKey)) {
      console.log('Duplicate ICE candidate ignored');
      return;
    }
    processedMessages.current.iceCandidates.add(candidateKey);

    try {
      if (pc.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        console.log('ICE candidate added successfully');
      } else {
        console.log('ICE candidate queued - waiting for remote description');
      }
    } catch (err) {
      console.error('Error adding ICE candidate:', err);
    }
  }, [remoteUser]);

  const endCall = useCallback(() => {
    console.log('Ending call...');
    
    if (socket && remoteUser?.id) {
      socket.emit('call-ended', {
        to: remoteUser.id,
        from: localUser?.id
      });
    }

    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    // Очищаем обработанные сообщения
    processedMessages.current.offers.clear();
    processedMessages.current.answers.clear();
    processedMessages.current.iceCandidates.clear();

    setLocalStream(null);
    setRemoteStream(null);
    setIsConnected(false);
    setCallStarted(false);
    onEndCall();
  }, [localStream, socket, remoteUser, localUser, onEndCall]);

  // Обработка входящих сообщений WebRTC
  useEffect(() => {
    if (!socket) return;

    const handleOfferWrapper = (data) => {
      console.log('WebSocket: Received offer from:', data.from, 'expected:', remoteUser?.id);
      if (data.from === remoteUser?.id) {
        handleOffer(data);
      }
    };

    const handleAnswerWrapper = (data) => {
      console.log('WebSocket: Received answer from:', data.from, 'expected:', remoteUser?.id);
      if (data.from === remoteUser?.id) {
        handleAnswer(data);
      }
    };

    const handleIceCandidateWrapper = (data) => {
      console.log('WebSocket: Received ICE candidate from:', data.from, 'expected:', remoteUser?.id);
      if (data.from === remoteUser?.id) {
        handleIceCandidate(data);
      }
    };

    const handleCallEndedWrapper = (data) => {
      console.log('WebSocket: Call ended by:', data.from);
      if (data.from === remoteUser?.id) {
        setError('Собеседник завершил звонок');
        setTimeout(() => onEndCall(), 2000);
      }
    };

    const handleCallAcceptedWrapper = (data) => {
      console.log('WebSocket: Call accepted by:', data.from, 'isInitiator:', isInitiator, 'expected:', remoteUser?.id);
      if (isInitiator && data.from === remoteUser?.id) {
        setCallStatus('connecting');
        if (!peerConnectionRef.current) {
          console.log('Initiator starting call after acceptance');
          startCall();
        }
      }
    };

    const handleCallRejectedWrapper = (data) => {
      console.log('WebSocket: Call rejected by:', data.from);
      if (isInitiator && data.from === remoteUser?.id) {
        setError('Звонок отклонен');
        setTimeout(() => onEndCall(), 2000);
      }
    };

    // Регистрируем обработчики
    socket.on('offer', handleOfferWrapper);
    socket.on('answer', handleAnswerWrapper);
    socket.on('ice-candidate', handleIceCandidateWrapper);
    socket.on('call-ended', handleCallEndedWrapper);
    socket.on('call-accepted', handleCallAcceptedWrapper);
    socket.on('call-rejected', handleCallRejectedWrapper);

    return () => {
      // Отписываемся от всех обработчиков
      socket.off('offer', handleOfferWrapper);
      socket.off('answer', handleAnswerWrapper);
      socket.off('ice-candidate', handleIceCandidateWrapper);
      socket.off('call-ended', handleCallEndedWrapper);
      socket.off('call-accepted', handleCallAcceptedWrapper);
      socket.off('call-rejected', handleCallRejectedWrapper);
    };
  }, [socket, remoteUser, isInitiator, handleOffer, handleAnswer, handleIceCandidate, onEndCall, startCall]);

  // Автоматически начинаем звонок для инициатора после монтирования компонента
  useEffect(() => {
    if (isInitiator && socket && remoteUser && !callStarted) {
      console.log('Initiator component mounted, starting call setup');
      setCallStatus('calling');
      // Для инициатора начинаем настройку немедленно, но ждем принятия звонка для отправки offer
      initMedia().then(stream => {
        console.log('Initiator media initialized, waiting for call acceptance');
        setCallStatus('waiting');
      }).catch(err => {
        console.error('Failed to initialize media for initiator:', err);
      });
    }
  }, [isInitiator, socket, remoteUser, callStarted, initMedia]);

  // Функция для получения устройств
  const getDevices = useCallback(async () => {
    try {
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = deviceList.filter(device => device.kind === 'videoinput');
      const audioDevices = deviceList.filter(device => device.kind === 'audioinput');

      console.log('Available video devices:', videoDevices.map(d => ({ label: d.label, id: d.deviceId })));
      console.log('Available audio devices:', audioDevices.map(d => ({ label: d.label, id: d.deviceId })));

      setDevices({ video: videoDevices, audio: audioDevices });

      // Устанавливаем устройства по умолчанию только если не выбраны
      if (videoDevices.length > 0 && !selectedVideoDevice) {
        setSelectedVideoDevice(videoDevices[0].deviceId);
      }
      if (audioDevices.length > 0 && !selectedAudioDevice) {
        setSelectedAudioDevice(audioDevices[0].deviceId);
      }
    } catch (err) {
      console.error('Error getting devices:', err);
    }
  }, [selectedVideoDevice, selectedAudioDevice]);

  // Получаем доступные устройства
  useEffect(() => {
    getDevices();

    // Слушаем изменения устройств
    const handleDeviceChange = () => {
      console.log('Device change detected, refreshing devices...');
      getDevices();
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [getDevices]);

  // Обновляем список устройств при открытии настроек
  useEffect(() => {
    if (showDeviceSettings) {
      getDevices();
    }
  }, [showDeviceSettings, getDevices]);

  // Функция для переключения устройств во время звонка
  const switchDevice = useCallback(async (deviceType, deviceId) => {
    try {
      console.log(`=== SWITCH DEVICE START ===`);
      console.log(`Switching ${deviceType} to device:`, deviceId);
      console.log(`Current PeerConnection:`, peerConnectionRef.current);
      console.log(`Current localStream:`, localStream);

      const pc = peerConnectionRef.current;
      if (!pc) {
        console.error('ERROR: No peer connection available for device switching');
        return;
      }

      // Получаем список senders для диагностики
      const senders = pc.getSenders();
      console.log(`Current senders:`, senders.map(s => ({ kind: s.track?.kind, id: s.track?.id, enabled: s.track?.enabled })));

      let constraints = {};
      if (deviceType === 'video') {
        constraints = { video: { deviceId: { exact: deviceId } }, audio: false };
        console.log(`Setting video constraints:`, constraints);
        setSelectedVideoDevice(deviceId);
      } else if (deviceType === 'audio') {
        constraints = { video: false, audio: { deviceId: { exact: deviceId } } };
        console.log(`Setting audio constraints:`, constraints);
        setSelectedAudioDevice(deviceId);
      }

      console.log(`Requesting new media stream with constraints...`);
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log(`New stream obtained:`, newStream.id);

      const newTrack = deviceType === 'video' ? newStream.getVideoTracks()[0] : newStream.getAudioTracks()[0];
      console.log(`New ${deviceType} track:`, newTrack?.id, newTrack?.enabled, newTrack?.readyState);

      if (!newTrack) {
        throw new Error(`No ${deviceType} track found in new stream`);
      }

      // Находим существующий sender для этого типа трека
      const sender = senders.find(s => s.track?.kind === deviceType);
      console.log(`Found sender for ${deviceType}:`, sender);

      if (sender && sender.track) {
        const oldTrack = sender.track;
        console.log(`Replacing ${deviceType} track. Old: ${oldTrack.id}, New: ${newTrack.id}`);

        try {
          // Заменяем трек в PeerConnection
          await sender.replaceTrack(newTrack);
          console.log(`✅ Successfully replaced ${deviceType} track in PeerConnection`);

          // Проверяем, что замена прошла
          const updatedSender = pc.getSenders().find(s => s.track?.kind === deviceType);
          console.log(`Updated sender track:`, updatedSender?.track?.id);

          // Важно: НЕ обновляем localStream для аудио устройств, чтобы избежать конфликтов
          if (deviceType === 'video' && localStream) {
            console.log('Updating local video stream for display...');

            const updatedTracks = localStream.getTracks().map(track => {
              if (track.kind === deviceType) {
                console.log(`Replacing ${deviceType} track in localStream: ${track.id} -> ${newTrack.id}`);
                // Останавливаем старый трек
                track.stop();
                return newTrack;
              }
              return track;
            });

            const updatedStream = new MediaStream(updatedTracks);
            console.log('New local stream tracks:', updatedStream.getTracks().map(t => ({ kind: t.kind, id: t.id })));

            setLocalStream(updatedStream);

            if (localVideoRef.current) {
              console.log('Updating local video element...');
              localVideoRef.current.srcObject = updatedStream;
            }
          } else if (deviceType === 'audio') {
            console.log('Audio device switched - keeping existing localStream to avoid conflicts');
            // Для аудио просто останавливаем старый трек
            oldTrack.stop();
          }

        } catch (replaceError) {
          console.error(`❌ Failed to replace ${deviceType} track:`, replaceError);
          throw replaceError;
        }

        console.log(`✅ Device switch completed successfully for ${deviceType}`);
      } else {
        console.error(`❌ No ${deviceType} sender found. Available senders:`, senders.map(s => s.track?.kind));
        console.error(`Cannot switch ${deviceType} device - no active track to replace`);
      }

      // Останавливаем временный поток
      newStream.getTracks().forEach(track => {
        if (track !== newTrack) {
          track.stop();
        }
      });

      console.log(`=== SWITCH DEVICE END ===`);

    } catch (err) {
      console.error(`❌ Error switching ${deviceType} device:`, err);
      setError(`Ошибка при переключении ${deviceType === 'video' ? 'камеры' : 'микрофона'}: ${err.message}`);
    }
  }, [localStream]);

  // Устанавливаем remote stream когда он приходит
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      console.log('Setting remote stream in useEffect:', remoteStream.id);
      console.log('Remote stream tracks:', remoteStream.getTracks().map(t => ({ kind: t.kind, id: t.id })));
      console.log('Local stream id (for comparison):', localStream?.id);
      console.log('Current remoteVideoRef.srcObject:', remoteVideoRef.current.srcObject);

      // Дополнительная проверка перед установкой
      if (localStream && remoteStream.id === localStream.id) {
        console.error('ERROR: Attempting to set local stream as remote stream! Aborting.');
        return;
      }

      // Принудительно очищаем и устанавливаем новый стрим
      const videoElement = remoteVideoRef.current;

      // Останавливаем текущее видео если оно играет
      if (videoElement.srcObject) {
        console.log('Stopping current video stream before setting new one');
        const currentStream = videoElement.srcObject;
        if (currentStream instanceof MediaStream) {
          currentStream.getTracks().forEach(track => {
            console.log('Stopping track:', track.kind, track.id);
            track.stop();
          });
        }
      }

      // Очищаем srcObject
      videoElement.srcObject = null;

      // Небольшая задержка для гарантии очистки
      setTimeout(() => {
        console.log('Setting new remote stream after delay');
        videoElement.srcObject = remoteStream;

        // Принудительно перезагружаем видео элемент
        videoElement.load();

        // Пытаемся воспроизвести
        videoElement.play().then(() => {
          console.log('Remote video started playing successfully');
        }).catch(e => {
          console.log('Remote video play failed, but continuing:', e);
          // Иногда play() падает, но видео все равно работает
        });

        console.log('New remoteVideoRef.srcObject set successfully:', videoElement.srcObject?.id);
      }, 100);
    }
  }, [remoteStream, localStream]);
  
  // Стили
  const styles = {
    container: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#1a1a1a',
      color: 'white',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      padding: '20px'
    },
    header: {
      textAlign: 'center',
      marginBottom: '20px'
    },
    title: {
      margin: 0,
      fontSize: '24px'
    },
    status: {
      marginTop: '10px',
      color: '#4CAF50',
      fontWeight: 'bold'
    },
    error: {
      backgroundColor: '#ff4444',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      textAlign: 'center',
      marginBottom: '20px'
    },
    videoContainer: {
      display: 'flex',
      flex: 1,
      gap: '20px',
      justifyContent: 'center',
      alignItems: 'center',
      flexWrap: 'wrap'
    },
    videoWrapper: {
      position: 'relative',
      textAlign: 'center'
    },
    videoLabel: {
      marginBottom: '10px',
      fontSize: '16px'
    },
    video: {
      width: '400px',
      height: '300px',
      backgroundColor: '#333',
      borderRadius: '10px',
      border: isConnected ? '2px solid #4CAF50' : '2px solid #666',
      objectFit: 'cover'
    },
    connectingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: '10px'
    },
    controls: {
      display: 'flex',
      justifyContent: 'center',
      marginTop: '20px',
      gap: '20px'
    },
    endButton: {
      padding: '15px 30px',
      backgroundColor: '#f44336',
      color: 'white',
      border: 'none',
      borderRadius: '50px',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: 'bold',
      transition: 'background-color 0.3s'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>
          📹 Видеозвонок {isInitiator ? 'с' : 'от'} {remoteUser?.name || 'собеседником'}
        </h2>
        <div style={styles.status}>
          {callStatus === 'calling' && '📞 Начало звонка...'}
          {callStatus === 'waiting' && '⏳ Ожидание ответа...'}
          {callStatus === 'connecting' && '🔄 Подключение...'}
          {callStatus === 'connected' && '✅ Соединение установлено'}
        </div>
      </div>

      {error && (
        <div style={styles.error}>
          ⚠️ {error}
        </div>
      )}

      <div style={styles.videoContainer}>
        <div style={styles.videoWrapper}>
          <p style={styles.videoLabel}>{t('videoCall.you')}</p>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={styles.video}
          />
          {!localStream && (
            <div style={styles.connectingOverlay}>
              <div>Загрузка вашей камеры...</div>
            </div>
          )}
        </div>

        <div style={styles.videoWrapper}>
          <p style={styles.videoLabel}>{t('videoCall.interlocutor')}</p>
          <video
            key={remoteStream?.id || 'remote-video'}
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={styles.video}
          />
          {!isConnected && (
            <div style={styles.connectingOverlay}>
              <div style={{ fontSize: '48px', animation: 'pulse 1s infinite' }}>
                {callStatus === 'waiting' ? '📞' : '🔄'}
              </div>
              <p>
                {callStatus === 'waiting'
                  ? 'Ожидание ответа...'
                  : 'Подключение к собеседнику...'}
              </p>
            </div>
          )}
        </div>
      </div>

      <div style={styles.controls}>
        <button
          onClick={() => setShowDeviceSettings(!showDeviceSettings)}
          style={{
            ...styles.endButton,
            backgroundColor: '#2196F3',
            marginRight: '10px'
          }}
        >
          ⚙️ Устройства
        </button>
        <button
          onClick={endCall}
          style={styles.endButton}
        >
          📵 Завершить звонок
        </button>
      </div>

      {showDeviceSettings && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            backgroundColor: '#333',
            padding: '30px',
            borderRadius: '10px',
            minWidth: '400px',
            color: 'white'
          }}>
            <h3 style={{ marginTop: 0 }}>Настройки устройств</h3>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Камера:</label>
              <select
                value={selectedVideoDevice}
                onChange={(e) => switchDevice('video', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: '#444',
                  color: 'white',
                  border: '1px solid #666',
                  borderRadius: '5px'
                }}
              >
                {devices.video.map(device => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Камера ${device.deviceId.slice(0, 8)}`}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Микрофон:</label>
              <select
                value={selectedAudioDevice}
                onChange={(e) => switchDevice('audio', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: '#444',
                  color: 'white',
                  border: '1px solid #666',
                  borderRadius: '5px'
                }}
              >
                {devices.audio.map(device => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Микрофон ${device.deviceId.slice(0, 8)}`}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={getDevices}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                🔄 Обновить
              </button>
              <button
                onClick={() => setShowDeviceSettings(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCall;
