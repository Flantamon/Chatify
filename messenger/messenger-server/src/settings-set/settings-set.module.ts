import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsSet } from './entities/settings-set.entity';
import { SettingsSetService } from './settings-set.service';
import { SettingsSetController } from './settings-set.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SettingsSet])],
  providers: [SettingsSetService],
  controllers: [SettingsSetController],
  exports: [SettingsSetService],
})
export class SettingsSetModule {}
