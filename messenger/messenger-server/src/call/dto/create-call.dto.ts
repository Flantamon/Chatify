// src/call/dto/create-call.dto.ts
import { IsNumber, IsOptional, IsIn } from 'class-validator';

export class CreateCallDto {
  @IsNumber()
  to: number;

  @IsOptional()
  @IsNumber()
  from?: number;

  @IsOptional()
  callerName?: string;

  @IsOptional()
  @IsIn(['video', 'audio'])
  callType?: 'video' | 'audio';
}
