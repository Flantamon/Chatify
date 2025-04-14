import { IsNumber, IsOptional } from 'class-validator';

export class UpdateContactDto {
  @IsOptional()
  @IsNumber()
  ownerUserId?: number;

  @IsOptional()
  @IsNumber()
  contactUserId?: number;
}
