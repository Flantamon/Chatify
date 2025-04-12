import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Message } from 'src/message/entities/message.entity';

@Entity('channels')
export class Channel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { length: 45 })
  name: string;

  @Column('varchar', { length: 45 })
  tag: string;

  @OneToMany(() => Message, (message) => message.receiverChannel)
  messages: Message[];
}
