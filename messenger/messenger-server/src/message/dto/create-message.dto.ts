/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { IsNumber, IsOptional, IsString, ValidateIf } from 'class-validator';

export class CreateMessageDto {
  @IsNumber()
  @IsOptional()
  receiverChannelId?: number;

  @IsNumber()
  @IsOptional()
  receiverUserId?: number;

  @ValidateIf((o) => !o.fileUrl)
  @IsString()
  @IsOptional()
  text?: string;

  @IsString()
  @IsOptional()
  fileName?: string;

  @IsString()
  @IsOptional()
  fileUrl?: string;

  @IsString()
  @IsOptional()
  fileType?: string;

  @IsNumber()
  @IsOptional()
  fileSize?: number;
}
