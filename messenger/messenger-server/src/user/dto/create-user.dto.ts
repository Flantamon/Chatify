import { IsString, IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsOptional()
  @IsString()
  role?: 'user' | 'admin' = 'user';

  @IsString()
  @IsOptional()
  status?: 'active' | 'blocked' = 'active';

  @IsString()
  @IsOptional()
  theme?: 'dark' | 'light' | 'system' = 'system';

  @IsString()
  @IsOptional()
  language?: 'en' | 'ru' = 'en';
}
