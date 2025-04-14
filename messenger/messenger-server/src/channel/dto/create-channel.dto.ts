import { IsString, Length } from 'class-validator';

export class CreateChannelDto {
  @IsString()
  @Length(1, 45)
  name: string;

  @IsString()
  @Length(1, 45)
  tag: string;
}
