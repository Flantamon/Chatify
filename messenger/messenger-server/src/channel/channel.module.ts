import { Module } from '@nestjs/common';
import { ChannelService } from './channel.service';
import { ChannelController } from './channel.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channel } from './entities/channel.entity';
import { EventsModule } from 'src/events/events.module';

@Module({
  imports: [TypeOrmModule.forFeature([Channel]), EventsModule],
  controllers: [ChannelController],
  providers: [ChannelService],
  exports: [TypeOrmModule.forFeature([Channel])],
})
export class ChannelModule {}
