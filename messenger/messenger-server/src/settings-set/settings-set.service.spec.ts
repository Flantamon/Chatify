import { Test, TestingModule } from '@nestjs/testing';
import { SettingsSetService } from './settings-set.service';

describe('SettingsSetService', () => {
  let service: SettingsSetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SettingsSetService],
    }).compile();

    service = module.get<SettingsSetService>(SettingsSetService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
