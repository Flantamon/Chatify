import { IsString, IsOptional } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  text: string;

  @IsString()
  @IsOptional()
  file_name?: string;

  @IsString()
  @IsOptional()
  file_url?: string;

  @IsString()
  @IsOptional()
  file_type?: string;

  @IsString()
  @IsOptional()
  file_size?: number;
}
