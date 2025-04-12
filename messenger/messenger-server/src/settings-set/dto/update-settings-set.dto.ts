import { PartialType } from '@nestjs/mapped-types';
import { CreateSettingsSetDto } from './create-settings-set.dto';

export class UpdateSettingsSetDto extends PartialType(CreateSettingsSetDto) {}
