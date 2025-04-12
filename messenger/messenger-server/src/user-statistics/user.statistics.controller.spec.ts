import { Test, TestingModule } from '@nestjs/testing';
import { UserStatisticsController } from './user.statistics.controller';
import { UserStatisticsService } from './user.statistics.service';

describe('UserStatisticsController', () => {
  let controller: UserStatisticsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserStatisticsController],
      providers: [UserStatisticsService],
    }).compile();

    controller = module.get<UserStatisticsController>(UserStatisticsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
