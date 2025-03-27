import {
  Table,
  Column,
  Model,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  CreatedAt,
  Default,
  DataType,
  UpdatedAt,
} from 'sequelize-typescript';
import { User } from '../user/user.entity';
import { Channel } from '../channel/channel.entity';

@Table({ tableName: 'message', timestamps: false })
export class Message extends Model<Message> {
  @PrimaryKey
  @AutoIncrement
  @Column
  declare id: number;

  @ForeignKey(() => User)
  @Column
  sender_id: number;

  @ForeignKey(() => Channel)
  @Column
  receiver_channel_id: number;

  @ForeignKey(() => User)
  @Column
  receiver_user_id: number;

  @CreatedAt
  @Default(DataType.NOW)
  @Column
  created_at: Date;

  @UpdatedAt
  @Column
  updated_at: Date;

  @Column
  text: string;

  @Column
  file_name: string;

  @Column(DataType.TEXT)
  file_content: string;

  @Column
  file_url: string;

  @Column
  file_type: string;

  @Column
  file_size: number;
}
