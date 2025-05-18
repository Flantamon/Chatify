/* eslint-disable @typescript-eslint/no-floating-promises */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as fs from 'fs';

async function bootstrap() {
  const httpsOptions = {
    key: fs.readFileSync('src/secrets/key.pem'),
    cert: fs.readFileSync('src/secrets/cert.pem'),
    rejectUnauthorized: false,
  };
  const app = await NestFactory.create(AppModule, {
    httpsOptions,
  });
  await app.listen(process.env.HTTPS_PORT ?? 3001);
}
bootstrap();
