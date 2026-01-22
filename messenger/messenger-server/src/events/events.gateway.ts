/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface WebSocketMessage {
  id: number;
  text?: string;
  messageType: string;
  sender: {
    id: number;
    name: string;
  };
  receiverUser?: {
    id: number;
    name: string;
  } | null;
  receiverChannel?: {
    id: number;
    name: string;
  } | null;
  created_at: Date;
  updated_at?: Date;
  fileUrl?: string;
  fileType?: string;
  fileSize?: number;
  duration?: number;
}

interface CallRequestData {
  callId: string;
  from: number;
  to: number;
  caller: {
    id: number;
    name: string;
  };
  callType: 'video' | 'audio';
  timestamp: Date;
}

interface CallResponseData {
  callId: string;
  from: number;
  to: number;
  status: 'accepted' | 'rejected' | 'ended';
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor() {
    console.log('WebSocket Gateway initialized');
  }

  @WebSocketServer()
  server: Server;

  // Хранилище для связи userId -> socketId
  private userSockets = new Map<number, string>();
  // Хранилище для связи socketId -> userId
  private socketUsers = new Map<string, number>();

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);

    // Получаем токен из handshake
    const token = client.handshake.auth?.token;
    if (token) {
      console.log(`Client ${client.id} connected with token`);
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);

    // Удаляем пользователя из хранилища
    const userId = this.socketUsers.get(client.id);
    if (userId) {
      this.userSockets.delete(userId);
      this.socketUsers.delete(client.id);
      console.log(`User ${userId} disconnected`);
    }
  }

  @SubscribeMessage('register')
  handleRegister(
    @MessageBody() data: { userId: number; name?: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { userId } = data;

      // Сохраняем связь
      this.userSockets.set(userId, client.id);
      this.socketUsers.set(client.id, userId);

      // Присоединяем к комнате пользователя
      void client.join(`user_${userId}`);

      console.log(`User ${userId} registered with socket ${client.id}`);

      return { success: true, message: 'Registered successfully' };
    } catch (e) {
      console.error('Register error:', e);
      return { success: false, error: 'Registration failed' };
    }
  }

  // Видеозвонки - обработка входящих сообщений от клиентов
  @SubscribeMessage('call-request')
  handleCallRequest(
    @MessageBody() data: { to: number; from: number; callerName?: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      console.log(`Call request from ${data.from} to ${data.to}`);

      // Получаем socketId получателя
      const receiverSocketId = this.userSockets.get(data.to);

      if (!receiverSocketId) {
        // Получатель не онлайн
        void client.emit('call-rejected', {
          from: data.to,
          reason: 'user-offline',
        });
        return;
      }

      // Отправляем запрос на звонок получателю
      void this.server.to(receiverSocketId).emit('call-request', {
        from: data.from,
        caller: {
          id: data.from,
          name: data.callerName || `User ${data.from}`,
        },
      });

      console.log(`Call request sent to user ${data.to}`);
    } catch (e) {
      console.error('Call request error:', e);
    }
  }

  @SubscribeMessage('call-accepted')
  handleCallAccepted(
    @MessageBody() data: { to: number; from: number },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      console.log(`Call accepted by ${data.from} for ${data.to}`);

      // Получаем socketId инициатора
      const initiatorSocketId = this.userSockets.get(data.to);

      if (initiatorSocketId) {
        // Отправляем подтверждение инициатору
        void this.server.to(initiatorSocketId).emit('call-accepted', {
          from: data.from,
        });

        console.log(`Call acceptance sent to initiator ${data.to}`);
      }
    } catch (e) {
      console.error('Call accepted error:', e);
    }
  }

  @SubscribeMessage('call-rejected')
  handleCallRejected(
    @MessageBody() data: { to: number; from: number },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      console.log(`Call rejected by ${data.from} for ${data.to}`);

      // Получаем socketId инициатора
      const initiatorSocketId = this.userSockets.get(data.to);

      if (initiatorSocketId) {
        // Отправляем отклонение инициатору
        void this.server.to(initiatorSocketId).emit('call-rejected', {
          from: data.from,
        });

        console.log(`Call rejection sent to initiator ${data.to}`);
      }
    } catch (e) {
      console.error('Call rejected error:', e);
    }
  }

  @SubscribeMessage('call-ended')
  handleCallEnded(
    @MessageBody() data: { to: number; from: number },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      console.log(`Call ended by ${data.from} for ${data.to}`);

      // Получаем socketId собеседника
      const partnerSocketId = this.userSockets.get(data.to);

      if (partnerSocketId) {
        // Отправляем уведомление о завершении звонка
        void this.server.to(partnerSocketId).emit('call-ended', {
          from: data.from,
        });

        console.log(`Call ended notification sent to partner ${data.to}`);
      }
    } catch (e) {
      console.error('Call ended error:', e);
    }
  }

  // WebRTC сигнальные сообщения
  @SubscribeMessage('offer')
  handleOffer(
    @MessageBody() data: { to: number; from: number; offer: any },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      console.log(
        `WebRTC Offer from ${data.from} to ${data.to}, offer type:`,
        data.offer?.type,
      );

      // ВАЖНО: Проверяем, что to определено
      if (!data.to) {
        console.error('Offer missing "to" field:', data);
        return;
      }

      // Получаем socketId получателя
      const receiverSocketId = this.userSockets.get(data.to);

      if (receiverSocketId) {
        // Пересылаем offer получателю
        void this.server.to(receiverSocketId).emit('offer', {
          from: data.from,
          offer: data.offer,
        });

        console.log(`Offer forwarded to user ${data.to}`);
      } else {
        console.log(`User ${data.to} is not online, cannot forward offer`);
      }
    } catch (e) {
      console.error('Offer handling error:', e);
    }
  }

  @SubscribeMessage('answer')
  handleAnswer(
    @MessageBody() data: { to: number; from: number; answer: any },
    @ConnectedSocket() _client: Socket,
  ) {
    try {
      console.log(`WebRTC Answer from ${data.from} to ${data.to}`);

      // Получаем socketId получателя
      const receiverSocketId = this.userSockets.get(data.to);

      if (receiverSocketId) {
        // Пересылаем answer получателю
        void this.server.to(receiverSocketId).emit('answer', {
          from: data.from,
          answer: data.answer,
        });

        console.log(`Answer forwarded to user ${data.to}`);
      } else {
        console.log(`User ${data.to} is not online, cannot forward answer`);
      }
    } catch (e) {
      console.error('Answer handling error:', e);
    }
  }

  @SubscribeMessage('ice-candidate')
  handleIceCandidate(
    @MessageBody() data: { to: number; from: number; candidate: any },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      console.log(`ICE Candidate from ${data.from} to ${data.to}`);

      // Получаем socketId получателя
      const receiverSocketId = this.userSockets.get(data.to);

      if (receiverSocketId) {
        // Пересылаем ICE candidate получателю
        void this.server.to(receiverSocketId).emit('ice-candidate', {
          from: data.from,
          candidate: data.candidate,
        });

        console.log(`ICE candidate forwarded to user ${data.to}`);
      } else {
        console.log(
          `User ${data.to} is not online, cannot forward ICE candidate`,
        );
      }
    } catch (e) {
      console.error('ICE candidate handling error:', e);
    }
  }

  // Сообщения чата
  @SubscribeMessage('join')
  handleJoin(@MessageBody() userId: string, @ConnectedSocket() client: Socket) {
    console.log(`User ${userId} joined with socket ${client.id}`);
    void client.join(`user_${userId}`);
  }

  // Методы для отправки сообщений из других сервисов
  sendMessageToUser(message: WebSocketMessage): void {
    console.log('Sending message to users:', message);

    if (message.receiverUser) {
      // Личное сообщение - отправляем только отправителю и получателю
      console.log(
        `Sending private message from ${message.sender.id} to ${message.receiverUser.id}`,
      );
      void this.server
        .to(`user_${message.sender.id}`)
        .emit('new-message', message);
      void this.server
        .to(`user_${message.receiverUser.id}`)
        .emit('new-message', message);
    } else if (message.receiverChannel) {
      // Сообщение в канал - отправляем всем (пока нет комнат для каналов)
      console.log(
        `Sending channel message to channel ${message.receiverChannel.id}`,
      );
      void this.server.emit('new-message', message);
    } else {
      // Fallback - отправляем всем
      console.log('Sending message to all clients (fallback)');
      void this.server.emit('new-message', message);
    }
  }

  sendMessageUpdate(message: any): void {
    if (message.receiverUser) {
      // Отправляем обновление отправителю и получателю
      void this.server
        .to(`user_${message.sender.id}`)
        .emit('message-updated', message);
      void this.server
        .to(`user_${message.receiverUser.id}`)
        .emit('message-updated', message);
    } else if (message.receiverChannel) {
      // Отправляем всем для канальных сообщений
      void this.server.emit('message-updated', message);
    }
  }

  sendMessageDelete(message: any): void {
    if (message.receiverUser) {
      // Отправляем удаление отправителю и получателю
      void this.server
        .to(`user_${message.sender.id}`)
        .emit('message-deleted', { id: message.id });
      void this.server
        .to(`user_${message.receiverUser.id}`)
        .emit('message-deleted', { id: message.id });
    } else if (message.receiverChannel) {
      // Отправляем всем для канальных сообщений
      void this.server.emit('message-deleted', { id: message.id });
    }
  }

  // Методы для отправки уведомлений о звонках из CallService
  sendCallRequest(data: CallRequestData): void {
    console.log('Sending call request from service:', data);

    const receiverSocketId = this.userSockets.get(data.to); // Исправлено: получаем socketId получателя
    if (receiverSocketId) {
      void this.server.to(receiverSocketId).emit('call-request', {
        from: data.from,
        caller: data.caller,
        callType: data.callType,
        timestamp: data.timestamp,
      });
      console.log(`Call request sent to user ${data.to}`);
    } else {
      console.log(`User ${data.to} is not online, cannot send call request`);
      // Можно вернуть ошибку или обработать иначе
    }
  }

  sendCallAccepted(data: CallResponseData): void {
    console.log('Sending call accepted from service:', data);

    const callerSocketId = this.userSockets.get(data.to);
    if (callerSocketId) {
      void this.server.to(callerSocketId).emit('call-accepted', {
        from: data.from,
      });
      console.log(`Call accepted sent to user ${data.to}`);
    } else {
      console.log(`User ${data.to} is not online, cannot send call accepted`);
    }
  }

  sendCallRejected(data: CallResponseData): void {
    console.log('Sending call rejected from service:', data);

    const callerSocketId = this.userSockets.get(data.to);
    if (callerSocketId) {
      void this.server.to(callerSocketId).emit('call-rejected', {
        from: data.from,
      });
      console.log(`Call rejected sent to user ${data.to}`);
    } else {
      console.log(`User ${data.to} is not online, cannot send call rejected`);
    }
  }

  sendCallEnded(data: CallResponseData): void {
    console.log('Sending call ended from service:', data);

    const partnerSocketId = this.userSockets.get(data.to);
    if (partnerSocketId) {
      void this.server.to(partnerSocketId).emit('call-ended', {
        from: data.from,
      });
      console.log(`Call ended sent to user ${data.to}`);
    } else {
      console.log(`User ${data.to} is not online, cannot send call ended`);
    }
  }

  // Вспомогательные методы
  private getUserSocketId(userId: number): string | undefined {
    return this.userSockets.get(userId);
  }

  public isUserOnline(userId: number): boolean {
    return this.userSockets.has(userId);
  }

  // Получение активных соединений (для отладки)
  public getActiveConnections(): Map<number, string> {
    return new Map(this.userSockets);
  }

  // Отправка сообщения конкретному пользователю по userId
  public sendToUser(userId: number, event: string, data: any): boolean {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      void this.server.to(socketId).emit(event, data);
      return true;
    }
    return false;
  }

  // Принудительное отключение пользователя
  public disconnectUser(userId: number): boolean {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      const socket = this.server.sockets.sockets.get(socketId);
      if (socket) {
        socket.disconnect(true);
        return true;
      }
    }
    return false;
  }

  // Получение userId по socketId
  public getUserIdBySocketId(socketId: string): number | undefined {
    return this.socketUsers.get(socketId);
  }

  // Получение socketId по userId
  public getSocketIdByUserId(userId: number): string | undefined {
    return this.userSockets.get(userId);
  }

  // Методы для отправки уведомлений о каналах
  sendChannelCreated(channel: any): void {
    console.log('Sending channel created notification:', channel);
    void this.server.emit('channel-created', channel);
  }

  sendChannelUpdated(channel: any): void {
    console.log('Sending channel updated notification:', channel);
    void this.server.emit('channel-updated', channel);
  }

  sendChannelDeleted(channelId: number): void {
    console.log('Sending channel deleted notification:', channelId);
    void this.server.emit('channel-deleted', { id: channelId });
  }

  // Отправка персонального уведомления пользователю о канале
  sendChannelNotificationToUser(
    userId: number,
    event: string,
    data: any,
  ): void {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      void this.server.to(socketId).emit(event, data);
      console.log(`Channel notification sent to user ${userId}:`, event, data);
    }
  }
}
