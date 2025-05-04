import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { Channel } from '../channel/entities/channel.entity';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,
  ) {}

  async create(
    createMessageDto: CreateMessageDto,
    senderId: number,
  ): Promise<Message> {
    const sender = await this.userRepository.findOne({
      where: { id: senderId },
    });
    if (!sender) {
      throw new NotFoundException('Sender not found');
    }

    const message = this.messageRepository.create({
      ...createMessageDto,
      sender,
    });

    if (createMessageDto.receiverUserId) {
      const receiverUser = await this.userRepository.findOne({
        where: { id: createMessageDto.receiverUserId },
      });
      if (!receiverUser) {
        throw new NotFoundException('Receiver user not found');
      }
      message.receiverUser = receiverUser;
    }

    return this.messageRepository.save(message);
  }

  async findAll(): Promise<Message[]> {
    return this.messageRepository.find({
      relations: ['sender', 'receiverUser', 'receiverChannel'],
    });
  }

  async findOne(id: number): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id },
      relations: ['sender', 'receiverUser', 'receiverChannel'],
    });
    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }
    return message;
  }

  async getUserMessages(userId: number): Promise<Message[]> {
    return this.messageRepository.find({
      where: [{ sender: { id: userId } }, { receiverUser: { id: userId } }],
      relations: ['sender', 'receiverUser', 'receiverChannel'],
      order: { created_at: 'DESC' },
    });
  }

  async update(
    id: number,
    updateMessageDto: UpdateMessageDto,
  ): Promise<Message> {
    const message = await this.findOne(id);
    this.messageRepository.merge(message, updateMessageDto);
    return this.messageRepository.save(message);
  }

  async remove(id: number): Promise<Message> {
    const message = await this.findOne(id);
    await this.messageRepository.remove(message);
    return message;
  }
}
