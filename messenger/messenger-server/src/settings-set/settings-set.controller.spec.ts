import { Test, TestingModule } from '@nestjs/testing';
import { SettingsSetController } from './settings-set.controller';
import { SettingsSetService } from './settings-set.service';

describe('SettingsSetController', () => {
  let controller: SettingsSetController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SettingsSetController],
      providers: [SettingsSetService],
    }).compile();

    controller = module.get<SettingsSetController>(SettingsSetController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
