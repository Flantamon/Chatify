import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Unique,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { SettingsSet } from 'src/settings-set/entities/settings-set.entity';
import { Contact } from 'src/contact/entities/contact.entity';
import { Message } from 'src/message/entities/message.entity';

@Unique(['email'])
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { length: 45 })
  role: string;

  @Column('varchar', { length: 45 })
  status: string;

  @Column('varchar', { length: 45 })
  name: string;

  @Column('varchar', { length: 100 })
  email: string;

  @Column('varchar', { length: 255 })
  password: string;

  @OneToOne(() => SettingsSet, (settingsSet) => settingsSet.user)
  settingsSet: SettingsSet;

  @OneToMany(() => Contact, (contact) => contact.owner)
  contactsAsOwner: Contact[];

  @OneToMany(() => Contact, (contact) => contact.contact)
  contactsAsContact: Contact[];

  @OneToMany(() => Message, (message) => message.sender)
  sentMessages: Message[];

  @OneToMany(() => Message, (message) => message.receiverUser)
  receivedMessages: Message[];
}
