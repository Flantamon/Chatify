import {
  Table,
  Column,
  Model,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  CreatedAt,
} from 'sequelize-typescript';
import { User } from '../../users/entities/user.entity';

@Table({ tableName: 'contact', timestamps: false })
export class Contact extends Model<Contact> {
  @PrimaryKey
  @AutoIncrement
  @Column
  declare id: number;

  @ForeignKey(() => User)
  @Column
  owner_user_id: number;

  @ForeignKey(() => User)
  @Column
  contact_user_id: number;

  @CreatedAt
  @Column
  created_at: Date;

  owner?: User;
  contact?: User;
}
