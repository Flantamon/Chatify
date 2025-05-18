import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ cors: true }) // Настроить CORS для WebSocket
export class WebRTCGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('WebRTC Gateway');

  private users = new Map<string, Socket>(); // Мапа для отслеживания пользователей по их ID

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.users.delete(client.id); // Удаляем пользователя из списка при отключении
  }

  // Подключение пользователя к WebSocket с его ID
  @SubscribeMessage('join')
  handleJoin(@MessageBody() userId: string, @ConnectedSocket() client: Socket) {
    this.users.set(userId, client);
    this.logger.log(`User ${userId} joined with socket ID: ${client.id}`);
  }

  // Обработка сигнала "offer" от отправителя
  @SubscribeMessage('offer')
  handleOffer(
    @MessageBody() data: { offer: any; to: string },
    @ConnectedSocket() client: Socket,
  ) {
    const receiver = this.users.get(data.to);
    if (receiver) {
      this.logger.log(`Sending offer from ${client.id} to ${data.to}`);
      receiver.emit('offer', data.offer);
    }
  }

  // Обработка сигнала "answer" от получателя
  @SubscribeMessage('answer')
  handleAnswer(
    @MessageBody() data: { answer: any; to: string },
    @ConnectedSocket() client: Socket,
  ) {
    const receiver = this.users.get(data.to);
    if (receiver) {
      this.logger.log(`Sending answer from ${client.id} to ${data.to}`);
      receiver.emit('answer', data.answer);
    }
  }

  // Обработка сигнала "candidate"
  @SubscribeMessage('candidate')
  handleCandidate(
    @MessageBody() data: { candidate: any; to: string },
    @ConnectedSocket() client: Socket,
  ) {
    const receiver = this.users.get(data.to);
    if (receiver) {
      this.logger.log(`Sending candidate from ${client.id} to ${data.to}`);
      receiver.emit('candidate', data.candidate);
    }
  }
}
