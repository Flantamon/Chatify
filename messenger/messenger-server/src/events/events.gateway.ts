import {
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Authorization',
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayInit {
  @WebSocketServer()
  private server!: Server;

  afterInit(): void {
    console.log('WebSocket Secure (WSS) Gateway initialized');
  }

  // @SubscribeMessage('join')
  // handleJoin(
  //   @MessageBody() room: string,
  //   @ConnectedSocket() client: Socket,
  // ): void {
  //   void client.join(room);
  //   this.server.to(room).emit('user-joined', client.id);
  // }

  // @SubscribeMessage('offer')
  // handleOffer(
  //   @MessageBody() data: SignalPayload,
  //   @ConnectedSocket() client: Socket,
  // ): void {
  //   this.server
  //     .to(data.room)
  //     .emit('offer', { offer: data.offer, sender: client.id });
  // }

  // @SubscribeMessage('answer')
  // handleAnswer(
  //   @MessageBody() data: SignalPayload,
  //   @ConnectedSocket() client: Socket,
  // ): void {
  //   this.server
  //     .to(data.room)
  //     .emit('answer', { answer: data.answer, sender: client.id });
  // }

  // @SubscribeMessage('ice-candidate')
  // handleIceCandidate(
  //   @MessageBody() data: SignalPayload,
  //   @ConnectedSocket() client: Socket,
  // ): void {
  //   this.server
  //     .to(data.room)
  //     .emit('ice-candidate', { candidate: data.candidate, sender: client.id });
  // }

  // @SubscribeMessage('join-user')
  // handleUserJoin(
  //   @MessageBody() userId: string,
  //   @ConnectedSocket() client: Socket,
  // ): void {
  //   const room = `user:${userId}`;
  //   void client.join(room);
  //   console.log(`Пользователь ${userId} подключён к комнате ${room}`);
  // }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(
    @MessageBody() room: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(room);
    console.log(`Client ${client.id} joined room ${room}`);
  }

  @SubscribeMessage('offer')
  handleOffer(
    @MessageBody() data: { room: string; offer: any },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(data.room).emit('offer', data.offer);
  }

  @SubscribeMessage('answer')
  handleAnswer(
    @MessageBody() data: { room: string; answer: any },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(data.room).emit('answer', data.answer);
  }

  @SubscribeMessage('candidate')
  handleCandidate(
    @MessageBody() data: { room: string; candidate: any },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(data.room).emit('candidate', data.candidate);
  }

  sendMessageToUser(message: any): void {
    this.server.emit('new-message', message);
  }
}
