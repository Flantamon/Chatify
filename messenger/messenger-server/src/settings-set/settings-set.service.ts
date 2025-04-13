import { Injectable } from '@nestjs/common';
import { CreateSettingsSetDto } from './dto/create-settings-set.dto';
import { UpdateSettingsSetDto } from './dto/update-settings-set.dto';

@Injectable()
export class SettingsSetService {
  create(createSettingsSetDto: CreateSettingsSetDto) {
    return 'This action adds a new settingsSet';
  }

  findAll() {
    return `This action returns all settingsSet`;
  }

  findOne(id: number) {
    return `This action returns a #${id} settingsSet`;
  }

  update(id: number, updateSettingsSetDto: UpdateSettingsSetDto) {
    return `This action updates a #${id} settingsSet`;
  }

  remove(id: number) {
    return `This action removes a #${id} settingsSet`;
  }
}
