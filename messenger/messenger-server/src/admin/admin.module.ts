import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { ChannelsModule } from './channels/channels.module';

@Module({
  imports: [UsersModule, ChannelsModule]
})
export class AdminModule {}
