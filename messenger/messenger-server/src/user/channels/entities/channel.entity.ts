import {
  Table,
  Column,
  Model,
  PrimaryKey,
  AutoIncrement,
} from 'sequelize-typescript';

@Table({ tableName: 'channel', timestamps: false })
export class Channel extends Model<Channel> {
  @PrimaryKey
  @AutoIncrement
  @Column
  declare id: number;

  @Column
  name: string;

  @Column
  tag?: string;
}
