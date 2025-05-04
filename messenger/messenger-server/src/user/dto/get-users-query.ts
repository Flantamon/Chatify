import { IsOptional, IsIn, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from '../../shared/enums/user-role.enum';

export class GetUsersQueryDto {
  @IsOptional()
  @IsIn(['messages.count', 'createdAt', 'name'], {
    message: 'Invalid sortBy parameter',
  })
  sortBy?: 'messages.count' | 'createdAt' | 'name' = 'createdAt';

  @IsOptional()
  @IsIn(['ASC', 'DESC'], {
    message: 'sortDirection must be either ASC or DESC',
  })
  @Transform(({ value }: { value: string }) => value?.toUpperCase())
  sortDirection?: 'ASC' | 'DESC' = 'DESC';

  @IsOptional()
  @IsIn(Object.values(UserRole), { each: true })
  @Transform(({ value }: { value: string }) =>
    value ? value.split(',').map((role) => role.trim()) : [],
  )
  roles?: UserRole[] | string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  limit?: number = 10;

  @IsOptional()
  @IsIn(['true', 'false'])
  @Transform(({ value }: { value: string }) => value === 'true')
  countOnly?: boolean = false;

  @IsOptional()
  @IsIn(['true', 'false'])
  @Transform(({ value }: { value: string }) => value === 'true')
  mostActiveOnly?: boolean = false;
}
