import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SettingsSet } from './entities/settings-set.entity';
import { CreateSettingsSetDto } from './dto/create-settings-set.dto';
import { UpdateSettingsSetDto } from './dto/update-settings-set.dto';

@Injectable()
export class SettingsSetService {
  constructor(
    @InjectRepository(SettingsSet)
    private readonly settingsRepo: Repository<SettingsSet>,
  ) {}

  async create(
    user_id: number,
    dto: CreateSettingsSetDto,
  ): Promise<SettingsSet> {
    const existing = await this.settingsRepo.findOne({ where: { user_id } });
    if (existing)
      throw new ConflictException('Settings already exist for user');

    const settings = this.settingsRepo.create({ ...dto, user_id });
    return this.settingsRepo.save(settings);
  }

  async findAll(): Promise<SettingsSet[]> {
    return this.settingsRepo.find({ relations: ['user'] });
  }

  async findOne(user_id: number): Promise<SettingsSet> {
    const settings = await this.settingsRepo.findOne({
      where: { user_id },
      relations: ['user'],
    });
    if (!settings) throw new NotFoundException('Settings not found');
    return settings;
  }

  async update(
    user_id: number,
    dto: UpdateSettingsSetDto,
  ): Promise<SettingsSet> {
    const settings = await this.findOne(user_id);
    Object.assign(settings, dto);
    return this.settingsRepo.save(settings);
  }

  async remove(user_id: number): Promise<void> {
    const settings = await this.findOne(user_id);
    await this.settingsRepo.remove(settings);
  }
}
