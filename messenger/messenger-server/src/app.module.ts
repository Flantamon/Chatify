import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { MessageModule } from './message/message.module';
import { ContactModule } from './contact/contact.module';
import { SettingsSetModule } from './settings-set/settings-set.module';
import { ChannelModule } from './channel/channel.module';
import { UserStatisticsModule } from './user-statistics/user-statistics.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    UserModule,
    AuthModule,
    UserStatisticsModule,
    ChannelModule,
    SettingsSetModule,
    ContactModule,
    MessageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
