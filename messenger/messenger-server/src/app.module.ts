import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { MessageModule } from './message/message.module';
import { ContactModule } from './contact/contact.module';
import { SettingsSetModule } from './settings-set/settings-set.module';
import { ChannelModule } from './channel/channel.module';
import { UserStatisticsModule } from './user-statistics/user.statistics.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configFactory from './config';

@Module({
  imports: [
    UserModule,
    AuthModule,
    UserStatisticsModule,
    ChannelModule,
    SettingsSetModule,
    ContactModule,
    MessageModule,
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
      load: [configFactory],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) =>
       configService.get('dbConfig') as any,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
