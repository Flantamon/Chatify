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

@WebSocketGateway({ cors: true })
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor() {
    console.log('dawdawdawdawdafgsrgsth');
  }

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('offer')
  handleOffer(@MessageBody() offer: any, @ConnectedSocket() client: Socket) {
    try {
      console.log(`Offer`, client.id, offer);
      client.broadcast.emit('offer', offer);
    } catch (e) {
      console.error('offer', e);
    }
  }

  @SubscribeMessage('answer')
  handleAnswer(@MessageBody() answer: any, @ConnectedSocket() client: Socket) {
    try {
      console.log(`Answer`);
      client.broadcast.emit('answer', answer);
    } catch (e) {
      console.error('answer', e);
    }
  }

  @SubscribeMessage('candidate')
  handleCandidate(
    @MessageBody() candidate: any,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      console.log(`Candidate`);
      client.broadcast.emit('candidate', candidate);
    } catch (e) {
      console.error('candidate', e);
    }
  }

  sendMessageToUser(message: any): void {
    this.server.emit('new-message', message);
  }
}
