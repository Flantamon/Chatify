import { IsString, IsOptional } from 'class-validator';

export class UpdateMessageDto {
  @IsString()
  @IsOptional()
  text?: string;
}
