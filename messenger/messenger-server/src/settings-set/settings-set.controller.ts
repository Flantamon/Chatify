import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SettingsSetService } from './settings-set.service';
import { CreateSettingsSetDto } from './dto/create-settings-set.dto';
import { UpdateSettingsSetDto } from './dto/update-settings-set.dto';

@Controller('settings-set')
export class SettingsSetController {
  constructor(private readonly settingsSetService: SettingsSetService) {}

  @Post()
  create(@Body() createSettingsSetDto: CreateSettingsSetDto) {
    return this.settingsSetService.create(createSettingsSetDto);
  }

  @Get()
  findAll() {
    return this.settingsSetService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.settingsSetService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSettingsSetDto: UpdateSettingsSetDto) {
    return this.settingsSetService.update(+id, updateSettingsSetDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.settingsSetService.remove(+id);
  }
}
