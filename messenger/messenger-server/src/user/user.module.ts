import { Module } from '@nestjs/common';
import { SettingsModule } from './settings/settings.module';
import { ContactsModule } from './contacts/contacts.module';
import { ChannelsModule } from './channels/channels.module';
import { UsersModule } from './users/users.module';
import { MessagesModule } from './messages/messages.module';

@Module({
  imports: [SettingsModule, ContactsModule, ChannelsModule, UsersModule, MessagesModule]
})
export class UserModule {}
