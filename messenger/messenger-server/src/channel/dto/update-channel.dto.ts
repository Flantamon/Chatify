import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateChannelDto {
  @IsOptional()
  @IsString()
  @Length(1, 45)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 45)
  tag?: string;
}
