import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsIn } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @IsIn(['dark', 'light', 'system'], {
    message: 'Theme must be dark, light or system',
  })
  theme?: 'dark' | 'light' | 'system';

  @IsOptional()
  @IsIn(['en', 'ru'], { message: 'Language must be en or ru' })
  language?: 'en' | 'ru';

  @IsOptional()
  @IsIn(['active', 'blocked'], { message: 'Status must be active or blocked' })
  status?: 'active' | 'blocked';

  @IsOptional()
  @IsIn(['user', 'admin'], { message: 'Role must be user or admin' })
  role?: 'user' | 'admin';
}
