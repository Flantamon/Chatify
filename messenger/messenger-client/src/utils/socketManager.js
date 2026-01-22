import io from 'socket.io-client';
import { getUserIdFromToken, getToken, getApiHost } from './auth';

class SocketManager {
  constructor() {
    this.socket = null;
    this.messageHandlers = new Set();
    this.updateHandlers = new Set();
    this.deleteHandlers = new Set();
    this.callRequestHandlers = new Set();
    this.callEndedHandlers = new Set();
    this.callAcceptedHandlers = new Set();
    this.callRejectedHandlers = new Set();
    this.iceCandidateHandlers = new Set(); // Новый обработчик для ICE кандидатов
    this.isConnecting = false;
    this.userId = null;
    this.registered = false;
    this.messageQueue = new Map();
  }

  connect() {
    if (this.socket?.connected) {
      return this.socket;
    }

    if (this.isConnecting) {
      return null;
    }

    this.isConnecting = true;
    this.userId = getUserIdFromToken();

    const socketUrl = process.env.REACT_APP_WS_URL || `wss://${getApiHost()}` || 'wss://localhost:3001';
    
    this.socket = io(socketUrl, {
      transports: ['websocket'],
      rejectUnauthorized: false,
      autoConnect: true,
      auth: {
        token: getToken()
      }
    });

    this.socket.on('connect', () => {
      console.log('Connected to Socket.IO server, ID:', this.socket.id);
      this.registered = false;
      if (this.userId) {
        this.socket.emit('register', { userId: this.userId });
      }
      this.isConnecting = false;
    });

    this.socket.on('registered', () => {
      console.log('Registered on server with userId:', this.userId);
      this.registered = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from Socket.IO server:', reason);
      this.registered = false;
    });

    this.socket.on('connect_error', (err) => {
      console.error('Socket.IO connection error:', err);
      this.isConnecting = false;
    });

    // Обработка сообщений чата
    this.socket.on('new-message', (msg) => {
      this.handleWithDeduplication('message', msg.id, () => {
        this.messageHandlers.forEach(handler => {
          try {
            handler(msg);
          } catch (error) {
            console.error('Error in message handler:', error);
          }
        });
      });
    });

    this.socket.on('message-updated', (msg) => {
      this.handleWithDeduplication('update', msg.id, () => {
        this.updateHandlers.forEach(handler => {
          try {
            handler(msg);
          } catch (error) {
            console.error('Error in update handler:', error);
          }
        });
      });
    });

    this.socket.on('message-deleted', (data) => {
      this.handleWithDeduplication('delete', data.id, () => {
        this.deleteHandlers.forEach(handler => {
          try {
            handler(data);
          } catch (error) {
            console.error('Error in delete handler:', error);
          }
        });
      });
    });

    // Обработка видеозвонков
    this.socket.on('call-request', (data) => {
      console.log('Received call request:', data);
      
      if (data.to && data.to !== this.userId) {
        return;
      }
      
      this.callRequestHandlers.forEach(handler => handler(data));
    });

    this.socket.on('call-accepted', (data) => {
      console.log('Call accepted:', data);
      
      if (data.to && data.to !== this.userId) {
        return;
      }
      
      this.callAcceptedHandlers.forEach(handler => handler(data));
    });

    this.socket.on('call-rejected', (data) => {
      console.log('Call rejected:', data);
      
      if (data.to && data.to !== this.userId) {
        return;
      }
      
      this.callRejectedHandlers.forEach(handler => handler(data));
    });

    this.socket.on('call-ended', (data) => {
      console.log('Call ended:', data);
      
      if (data.to && data.to !== this.userId) {
        return;
      }
      
      this.callEndedHandlers.forEach(handler => handler(data));
    });

    // WebRTC сигнальные сообщения обрабатываются напрямую в VideoCall
    this.socket.on('offer', (data) => {
      console.log('Received offer:', data);
      if (data.to && data.to !== this.userId) {
        return;
      }
    });

    this.socket.on('answer', (data) => {
      console.log('Received answer:', data);
      if (data.to && data.to !== this.userId) {
        return;
      }
    });

    this.socket.on('ice-candidate', (data) => {
      console.log('Received ICE candidate:', data);
      
      if (data.to && data.to !== this.userId) {
        return;
      }
      
      // ICE кандидаты - отдельный тип сообщений!
      this.iceCandidateHandlers.forEach(handler => handler(data));
    });

    return this.socket;
  }

  handleWithDeduplication(type, id, handler) {
    const key = `${type}:${id}`;
    const now = Date.now();
    
    for (const [k, timestamp] of this.messageQueue) {
      if (now - timestamp > 5000) {
        this.messageQueue.delete(k);
      }
    }
    
    if (this.messageQueue.has(key)) {
      console.log(`Duplicate ${type} message ignored:`, id);
      return;
    }
    
    this.messageQueue.set(key, now);
    handler();
  }

  // Отправка сообщений
  sendOffer(toUserId, offer) {
    if (!toUserId) {
      console.error('Cannot send offer: toUserId is undefined');
      return;
    }
    
    console.log('Sending offer to:', toUserId);
    this.socket.emit('offer', {
      offer,
      to: toUserId,
      from: this.userId
    });
  }

  sendAnswer(toUserId, answer) {
    if (!toUserId) {
      console.error('Cannot send answer: toUserId is undefined');
      return;
    }
    
    console.log('Sending answer to:', toUserId);
    this.socket.emit('answer', {
      answer,
      to: toUserId,
      from: this.userId
    });
  }

  sendIceCandidate(toUserId, candidate) {
    if (!toUserId) {
      console.error('Cannot send ICE candidate: toUserId is undefined');
      return;
    }
    
    console.log('Sending ICE candidate to:', toUserId);
    this.socket.emit('ice-candidate', {
      candidate,
      to: toUserId,
      from: this.userId
    });
  }

  // Управление звонками
  requestCall(targetUserId, targetUserName) {
    if (!targetUserId) {
      console.error('Cannot request call: targetUserId is undefined');
      return;
    }
    
    console.log('Requesting call to:', targetUserId);
    this.socket.emit('call-request', {
      to: targetUserId,
      from: this.userId,
      callerName: targetUserName
    });
  }

  acceptCall(callerId) {
    if (!callerId) {
      console.error('Cannot accept call: callerId is undefined');
      return;
    }
    
    console.log('Accepting call from:', callerId);
    this.socket.emit('call-accepted', {
      to: callerId,
      from: this.userId
    });
  }

  rejectCall(callerId) {
    if (!callerId) {
      console.error('Cannot reject call: callerId is undefined');
      return;
    }
    
    console.log('Rejecting call from:', callerId);
    this.socket.emit('call-rejected', {
      to: callerId,
      from: this.userId
    });
  }

  endCall(partnerId) {
    if (!partnerId) {
      console.error('Cannot end call: partnerId is undefined');
      return;
    }
    
    console.log('Ending call with:', partnerId);
    this.socket.emit('call-ended', {
      to: partnerId,
      from: this.userId
    });
  }

  // Добавляем обработчик для ICE кандидатов
  addIceCandidateHandler(callback) {
    this.iceCandidateHandlers.add(callback);
  }

  removeIceCandidateHandler(callback) {
    this.iceCandidateHandlers.delete(callback);
  }

  // Геттеры и сеттеры для обработчиков
  addMessageHandler(handler) {
    this.messageHandlers.add(handler);
  }

  removeMessageHandler(handler) {
    this.messageHandlers.delete(handler);
  }

  addUpdateHandler(handler) {
    this.updateHandlers.add(handler);
  }

  removeUpdateHandler(handler) {
    this.updateHandlers.delete(handler);
  }

  addDeleteHandler(handler) {
    this.deleteHandlers.add(handler);
  }

  removeDeleteHandler(handler) {
    this.deleteHandlers.delete(handler);
  }

  addCallRequestHandler(callback) {
    this.callRequestHandlers.add(callback);
  }

  removeCallRequestHandler(callback) {
    this.callRequestHandlers.delete(callback);
  }

  addCallEndedHandler(callback) {
    this.callEndedHandlers.add(callback);
  }

  removeCallEndedHandler(callback) {
    this.callEndedHandlers.delete(callback);
  }

  addCallAcceptedHandler(callback) {
    this.callAcceptedHandlers.add(callback);
  }

  removeCallAcceptedHandler(callback) {
    this.callAcceptedHandlers.delete(callback);
  }

  addCallRejectedHandler(callback) {
    this.callRejectedHandlers.add(callback);
  }

  removeCallRejectedHandler(callback) {
    this.callRejectedHandlers.delete(callback);
  }

  getSocket() {
    return this.socket;
  }

  getUserId() {
    return this.userId;
  }
}

// Создаем единственный экземпляр
const socketManager = new SocketManager();

export default socketManager;
