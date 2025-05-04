/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import * as fs from 'fs';

@WebSocketGateway(443, {
  cors: {
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Authorization',
    credentials: true,
  },
  https: {
    key: fs.readFileSync('src/secrets/key.pem'),
    cert: fs.readFileSync('src/secrets/cert.pem'),
  },
})
export class EventsGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  afterInit(_server: Server) {
    console.log('WebSocket Secure (WSS) Gateway initialized');
  }

  // Пример обработчика события
  handleMessage(_client: any, payload: string): void {
    this.server.emit('message', payload); // Отправка всем клиентам
  }
}
