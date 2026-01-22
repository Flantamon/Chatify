// src/call/entities/call.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity('calls')
export class Call {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'caller_id' })
  caller: User;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'receiver_id' })
  receiver: User;

  @Column({
    type: 'varchar',
    length: 10,
    default: 'video',
  })
  callType: 'video' | 'audio';

  @Column({
    type: 'varchar',
    length: 20,
    default: 'pending',
  })
  status: 'pending' | 'accepted' | 'rejected' | 'ended' | 'missed';

  @CreateDateColumn({ name: 'started_at' })
  startedAt: Date;

  @Column({ name: 'answered_at', nullable: true })
  answeredAt: Date;

  @Column({ name: 'ended_at', nullable: true })
  endedAt: Date;

  @Column({ name: 'duration', nullable: true })
  duration: number;

  @CreateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
