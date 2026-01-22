import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ChannelService } from './channel.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { UserRole } from 'src/shared/enums/user-role.enum';
import { EventsGateway } from 'src/events/events.gateway';

@Controller('channels')
export class ChannelController {
  constructor(
    private readonly channelService: ChannelService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  async create(@Body() dto: CreateChannelDto) {
    const channel = await this.channelService.create(dto);
    this.eventsGateway.sendChannelCreated(channel);
    return channel;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER, UserRole.ADMIN)
  @Get()
  async findAll(@Query() query: { page?: number; limit?: number }) {
    const { page = 1, limit = 10 } = query;
    return await this.channelService.findAllWithPagination(page, limit);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('id/:id')
  findOne(@Param('id') id: string) {
    return this.channelService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER, UserRole.ADMIN)
  @Get('tag/:tag')
  findByTag(@Param('tag') tag: string) {
    return this.channelService.findByTag(tag);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateChannelDto) {
    const channel = await this.channelService.update(+id, dto);
    this.eventsGateway.sendChannelUpdated(channel);
    return channel;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const channelId = +id;
    await this.channelService.remove(channelId);
    this.eventsGateway.sendChannelDeleted(channelId);
    return { message: 'Channel deleted successfully' };
  }
}
