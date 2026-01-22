import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { MessageModule } from './message/message.module';
import { ContactModule } from './contact/contact.module';
import { ChannelModule } from './channel/channel.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import configFactory from './config';
import { CallModule } from './call/call.module';
import { EventsModule } from './events/events.module';

@Module({
  imports: [
    // Конфигурационные модули (должны быть первыми)
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
      load: [configFactory],
    }),

    // Database module
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        const dbConfig = configService.get<TypeOrmModuleOptions>('dbConfig');
        if (!dbConfig) {
          throw new Error('Database configuration is not defined');
        }
        return dbConfig;
      },
    }),

    // Функциональные модули
    AuthModule,
    UserModule,
    ChannelModule,
    ContactModule,

    // EventsModule должен быть ДО CallModule
    EventsModule,

    // CallModule зависит от EventsModule
    CallModule,

    // MessageModule (зависит от EventsModule для WebSocket уведомлений)
    MessageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
