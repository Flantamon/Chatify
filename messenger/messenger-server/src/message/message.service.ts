import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { Channel } from '../channel/entities/channel.entity';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async create(
    createMessageDto: CreateMessageDto,
    senderId: number,
    file?: Express.Multer.File,
  ): Promise<Message> {
    const sender = await this.userRepository.findOne({
      where: { id: senderId },
    });
    if (!sender) {
      throw new NotFoundException('Sender not found');
    }

    const message = this.messageRepository.create({
      text: createMessageDto.text || '',
      sender,
      messageType: createMessageDto.messageType || (file ? 'file' : 'text'),
      duration: createMessageDto.duration,
    });

    if (createMessageDto.receiverUserId) {
      const receiverUser = await this.userRepository.findOne({
        where: { id: createMessageDto.receiverUserId },
      });
      if (!receiverUser) {
        throw new NotFoundException('Receiver user not found');
      }
      message.receiverUser = receiverUser;
    } else if (createMessageDto.receiverChannelId) {
      const receiverChannel = await this.channelRepository.findOne({
        where: { id: createMessageDto.receiverChannelId },
      });
      if (!receiverChannel) {
        throw new NotFoundException('Receiver channel not found');
      }
      message.receiverChannel = receiverChannel;
    } else {
      throw new BadRequestException(
        'Message must have a receiver (user or channel).',
      );
    }

    if (file) {
      const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'messages');
      await fs.mkdir(uploadDir, { recursive: true });

      const fileExtension = path.extname(file.originalname);
      const uniqueFileName = `${uuidv4()}${fileExtension}`;
      const filePath = path.join(uploadDir, uniqueFileName);
      const fileUrl = `/uploads/messages/${uniqueFileName}`;

      try {
        await fs.writeFile(filePath, file.buffer);

        message.fileName = file.originalname;
        message.fileUrl = fileUrl;
        message.fileType = file.mimetype;
        message.fileSize = file.size;

        // Определяем тип сообщения на основе типа файла
        if (file.mimetype.startsWith('audio/')) {
          message.messageType = 'voice';
        } else {
          message.messageType = 'file';
        }
      } catch (error) {
        console.error('Error saving file:', error);
        throw new Error('Failed to save uploaded file.');
      }
    }

    if (!message.text && !message.fileUrl) {
      throw new BadRequestException('Cannot send an empty message.');
    }

    const savedMessage = await this.messageRepository.save(message);

    // Готовим сообщение для отправки через WebSocket
    const messageToSend = {
      ...savedMessage,
      sender: {
        id: savedMessage.sender.id,
        name: savedMessage.sender.name,
      },
      receiverUser: savedMessage.receiverUser
        ? {
            id: savedMessage.receiverUser.id,
            name: savedMessage.receiverUser.name,
          }
        : null,
      receiverChannel: savedMessage.receiverChannel
        ? {
            id: savedMessage.receiverChannel.id,
            name: savedMessage.receiverChannel.name,
          }
        : null,
    };
    console.log('Prepared message for WebSocket:', messageToSend);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    this.eventsGateway.sendMessageToUser(messageToSend as any);

    return savedMessage;
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

  async findConversationMessages(
    userId1: number,
    userId2: number,
  ): Promise<Message[]> {
    if (userId1 === userId2) {
      throw new BadRequestException(
        'Cannot fetch messages between a user and themselves.',
      );
    }
    return this.messageRepository.find({
      where: [
        { sender: { id: userId1 }, receiverUser: { id: userId2 } },
        { sender: { id: userId2 }, receiverUser: { id: userId1 } },
      ],
      relations: ['sender', 'receiverUser'],
      order: { created_at: 'ASC' },
    });
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
    const updatedMessage = await this.messageRepository.save(message);

    // Отправляем уведомление об обновлении сообщения
    this.eventsGateway.sendMessageUpdate(updatedMessage);

    return updatedMessage;
  }

  async remove(id: number): Promise<Message> {
    const message = await this.findOne(id);

    // Сохраняем ID до удаления
    const messageId = message.id;

    await this.messageRepository.remove(message);

    // Создаем объект с сохраненным ID
    const messageData = {
      id: messageId,
      sender: message.sender,
      receiverUser: message.receiverUser,
      receiverChannel: message.receiverChannel,
    };

    // Отправляем уведомление об удалении сообщения
    this.eventsGateway.sendMessageDelete(messageData);

    return message;
  }

  async findChannelMessages(channelId: number): Promise<Message[]> {
    const channel = await this.channelRepository.findOne({
      where: { id: channelId },
    });
    if (!channel) {
      throw new NotFoundException(`Channel with ID ${channelId} not found.`);
    }

    return this.messageRepository.find({
      where: {
        receiverChannel: { id: channelId },
      },
      relations: ['sender', 'receiverChannel'],
      order: { created_at: 'ASC' },
    });
  }

  async findMessageByFileName(fileName: string): Promise<Message | null> {
    return this.messageRepository.findOne({
      where: { fileUrl: `/uploads/messages/${fileName}` },
      relations: ['sender', 'receiverUser', 'receiverChannel'],
    });
  }
}
