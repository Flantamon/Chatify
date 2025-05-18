import { IsNumber } from 'class-validator';

export class CreateContactDto {
  @IsNumber()
  userId: number;
}
