import { Test, TestingModule } from '@nestjs/testing';
import { UserStatisticsService } from './user.statistics.service';

describe('UserStatisticsService', () => {
  let service: UserStatisticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserStatisticsService],
    }).compile();

    service = module.get<UserStatisticsService>(UserStatisticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
