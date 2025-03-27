import { Provider } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { Message } from 'src/user/messages/entities/message.entity';
import { User } from 'src/user/users/entities/user.entity';
import { SettingsSet } from 'src/user/settings/entities/setting.entity';
import { Channel } from 'src/user/channels/entities/channel.entity';
import { Contact } from 'src/user/contacts/entities/contact.entity';

export const Database: Provider = {
  provide: 'SEQUELIZE',
  useFactory: async () => {
    const sequelize = new Sequelize({
      dialect: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'alexey',
      password: 'sqlpass',
      database: 'messenger',
    });
    sequelize.addModels([Message, User, SettingsSet, Channel, Contact]);
    await sequelize.sync();
    return sequelize;
  },
};
