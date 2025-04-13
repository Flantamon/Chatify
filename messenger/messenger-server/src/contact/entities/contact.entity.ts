import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from 'src/user/entities/user.entity';

@Entity('contacts')
export class Contact {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.contactsAsOwner, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'owner_user_id' })
  owner: User;

  @ManyToOne(() => User, (user) => user.contactsAsContact, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'contact_user_id' })
  contact: User;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at: Date;
}
