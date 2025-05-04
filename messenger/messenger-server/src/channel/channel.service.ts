import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Channel } from './entities/channel.entity';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';

@Injectable()
export class ChannelService {
  constructor(
    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,
  ) {}

  async create(dto: CreateChannelDto): Promise<Channel> {
    const channel = this.channelRepository.create(dto);
    return this.channelRepository.save(channel);
  }

  async findAll(): Promise<Channel[]> {
    return this.channelRepository.find({ relations: ['messages'] });
  }

  async findOne(id: number): Promise<Channel> {
    const channel = await this.channelRepository.findOne({
      where: { id },
      relations: ['messages'],
    });
    if (!channel) throw new NotFoundException(`Channel #${id} not found`);
    return channel;
  }

  async findByTag(tag: string): Promise<Channel> {
    const channel = await this.channelRepository.findOne({
      where: { tag: ILike(tag) },
      relations: ['messages'],
    });
    if (!channel) {
      throw new NotFoundException(`Channel with tag '${tag}' not found`);
    }
    return channel;
  }

  async update(id: number, dto: UpdateChannelDto): Promise<Channel> {
    const channel = await this.findOne(id);
    Object.assign(channel, dto);
    return this.channelRepository.save(channel);
  }

  async remove(id: number): Promise<Channel> {
    const channel = await this.findOne(id);
    await this.channelRepository.remove(channel);
    return channel;
  }
}
