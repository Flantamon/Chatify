import {
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'AtLeastOneRecipient', async: false })
class AtLeastOneRecipient implements ValidatorConstraintInterface {
  validate(_: unknown, args: ValidationArguments): boolean {
    const obj = args.object as {
      receiverUserId?: number;
      receiverChannelId?: number;
    };
    return !!(obj.receiverUserId || obj.receiverChannelId);
  }

  defaultMessage(): string {
    return 'Either receiverUserId or receiverChannelId must be provided.';
  }
}

export class CreateMessageDto {
  @IsNumber()
  @IsOptional()
  receiverChannelId?: number;

  @IsNumber()
  @IsOptional()
  receiverUserId?: number;

  @ValidateIf((o: CreateMessageDto) => !o.fileUrl)
  @IsString()
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

  @Validate(AtLeastOneRecipient)
  dummyFieldForValidation: boolean;
}
