import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { Channel } from 'src/channel/entities/channel.entity';
import { User } from 'src/user/entities/user.entity';
import { EventsGateway } from 'src/events/events.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Message, User, Channel])],
  controllers: [MessageController],
  providers: [MessageService, EventsGateway],
  exports: [MessageService],
})
export class MessageModule {}
