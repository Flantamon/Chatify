import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity('settings_set')
export class SettingsSet {
  @PrimaryGeneratedColumn()
  settings_set_id: number;

  @Column('int')
  user_id: number;

  @Column('varchar', { length: 20 })
  theme: string;

  @Column('varchar', { length: 10 })
  language: string;

  @OneToOne(() => User, (user) => user.settingsSet)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
