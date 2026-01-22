/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-floating-promises */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as fs from 'fs';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  // Always use HTTPS for WebRTC compatibility
  const keyPath = 'src/secrets/key.pem';
  const certPath = 'src/secrets/cert.pem';

  // Create self-signed certificate if it doesn't exist
  if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    console.log(
      'SSL certificates not found, creating self-signed certificate...',
    );
    const { execSync } = require('child_process');
    execSync(
      `openssl req -x509 -newkey rsa:4096 -keyout ${keyPath} -out ${certPath} -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"`,
      { cwd: 'src/secrets' },
    );
    console.log('Self-signed certificate created.');
  }

  console.log('Starting server with HTTPS for WebRTC support...');
  const httpsOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  };

  const app = await NestFactory.create(AppModule, {
    httpsOptions,
  });

  app.useWebSocketAdapter(new IoAdapter(app));

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.listen(process.env.HTTPS_PORT ?? 3001, '0.0.0.0');
}
bootstrap();
