import { Module } from '@nestjs/common';
import { SettingsSetService } from './settings-set.service';
import { SettingsSetController } from './settings-set.controller';

@Module({
  controllers: [SettingsSetController],
  providers: [SettingsSetService],
})
export class SettingsSetModule {}
