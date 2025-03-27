import { Provider } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { Message } from '../message/message.entity';
import { User } from '../user/user.entity';
import { SettingsSet } from '../settings-set/setting-set.entity';
import { Channel } from '../channel/channel.entity';
import { Contact } from '../contact/contact.entity';

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
