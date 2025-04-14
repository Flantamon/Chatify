import { IsIn, IsOptional, IsString } from 'class-validator';

export class CreateSettingsSetDto {
  @IsOptional()
  @IsString()
  @IsIn(['light', 'dark', 'system'])
  theme: string;

  @IsOptional()
  @IsString()
  language: string;
}
