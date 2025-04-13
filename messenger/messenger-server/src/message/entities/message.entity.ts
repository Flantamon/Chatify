import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { Channel } from 'src/channel/entities/channel.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.sentMessages, {
    nullable: false,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @ManyToOne(() => Channel, (channel) => channel.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'receiver_channel_id' })
  receiverChannel: Channel;

  @ManyToOne(() => User, (user) => user.receivedMessages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'receiver_user_id' })
  receiverUser: User;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    nullable: true,
  })
  updated_at: Date;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  text: string;

  @Column({
    name: 'file_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  fileName: string;

  @Column({
    name: 'file_content',
    type: 'text',
    nullable: true,
  })
  fileContent: string;

  @Column({
    name: 'file_url',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  fileUrl: string;

  @Column({
    name: 'file_type',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  fileType: string;

  @Column({
    name: 'file_size',
    type: 'integer',
    nullable: true,
  })
  fileSize: number;
}
