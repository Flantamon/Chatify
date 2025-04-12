import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { UserStatisticsService } from './user.statistics.service';

@Controller('user.statistics')
export class UserStatisticsController {
  constructor(private readonly userStatisticsService: UserStatisticsService) {}

  /*@Post()
  create(@Body() createUserStatisticDto: CreateUserStatisticDto) {
    return this.userStatisticsService.create(createUserStatisticDto);
  }

  @Get()
  findAll() {
    return this.userStatisticsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userStatisticsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserStatisticDto: UpdateUserStatisticDto,
  ) {
    return this.userStatisticsService.update(+id, updateUserStatisticDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userStatisticsService.remove(+id);
  }*/
}
