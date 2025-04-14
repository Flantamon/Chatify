import { IsNumber } from 'class-validator';

export class CreateContactDto {
  @IsNumber()
  contactUserId: number;
}
