/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UserService {
  constructor(
    //@InjectRepository(Message)
    //private readonly messageRepository: Repository<Message>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async createUser(createUserDto: CreateUserDto) {
    const existUser = await this.userRepository.findOne({
      where: {
        email: createUserDto.email,
      },
    });

    if (existUser) {
      throw new BadRequestException('This email already exist');
    }

    const user = await this.userRepository.save({
      name: createUserDto.name,
      email: createUserDto.email,
      password: await argon2.hash(createUserDto.password),
    });

    const token = this.jwtService.sign({ email: createUserDto.email });

    return { user, token };
  }

  async findByEmail(email: string) {
    return this.userRepository.findOne({ where: { email } });
  }

  /*async getMessages(
    userId: number,
    filters: { receiver_user_id?: number; receiver_channel_id?: number },
  ) {
    try {
      const queryBuilder = this.messageRepository
        .createQueryBuilder('message')
        .leftJoinAndSelect('message.sender', 'sender')
        .leftJoinAndSelect('message.receiverUser', 'receiverUser')
        .leftJoinAndSelect('message.receiverChannel', 'receiverChannel')
        .where('message.sender.id = :userId', { userId });

      if (filters.receiver_user_id) {
        queryBuilder.andWhere('message.receiverUser.id = :receiverUserId', {
          receiverUserId: filters.receiver_user_id,
        });
      }

      if (filters.receiver_channel_id) {
        queryBuilder.andWhere(
          'message.receiverChannel.id = :receiverChannelId',
          {
            receiverChannelId: filters.receiver_channel_id,
          },
        );
      }

      queryBuilder.orderBy('message.created_at', 'DESC');

      const messages = await queryBuilder.getMany();

      return messages;
    } catch (error) {
      throw new Error(`Error fetching messages: ${error.message}`);
    }
  }*/
}
