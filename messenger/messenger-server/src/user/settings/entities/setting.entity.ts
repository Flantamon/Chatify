import {
  Table,
  Column,
  Model,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  Default,
  AllowNull,
} from 'sequelize-typescript';
import { User } from '../../users/entities/user.entity';

@Table({ tableName: 'settings_set', timestamps: false })
export class SettingsSet extends Model<SettingsSet> {
  @PrimaryKey
  @AutoIncrement
  @Column
  declare settings_set_id: number;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column
  user_id: number;

  @Default('light')
  @Column
  theme: string;

  @Default('en')
  @Column
  language: string;
}
