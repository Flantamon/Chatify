import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { SettingsSetService } from 'src/settings-set/settings-set.service';
import { UserRole } from 'src/shared/enums/user-role.enum';
import { BulkCreateResult } from 'src/shared/types/bulkCreateResult.type';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly settingsSetService: SettingsSetService,
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
      role: createUserDto.role,
      status: createUserDto.status,
    });

    const existingSettings = await this.settingsSetService
      .findOne(user.id)
      .catch(() => null);
    if (!existingSettings) {
      await this.settingsSetService.create(user.id, {
        theme: 'system',
        language: 'en',
      });
    }

    const token = this.jwtService.sign({ email: createUserDto.email });

    return { user, token };
  }

  async findByEmail(email: string) {
    return this.userRepository.findOne({ where: { email } });
  }

  async findAllUsers(): Promise<User[]> {
    return await this.userRepository.find();
  }

  async findOneUser(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return user;
  }

  async updateUser(id: number, dto: Partial<CreateUserDto>): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (dto.password) {
      dto.password = await argon2.hash(dto.password);
    }

    const updatedUser = await this.userRepository.save({ ...user, ...dto });
    return updatedUser;
  }

  async removeUser(id: number): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    await this.userRepository.remove(user);
    return { message: 'User deleted successfully' };
  }

  async updateUserStatus(userId: number, status: 'active' | 'blocked') {
    await this.userRepository.update(userId, { status });
    return { message: `User ${userId} status updated to ${status}` };
  }

  async findUsersByRoles(roles: UserRole[]) {
    return await this.userRepository.find({
      where: roles.map((role) => ({ role })),
    });
  }

  async updateUserRole(userId: number, role: UserRole) {
    await this.userRepository.update(userId, { role });
    return { message: `User ${userId} role updated to ${role}` };
  }

  async findMostActiveUsers() {
    return this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.sentMessages', 'sentMessages')
      .loadRelationCountAndMap('user.messageCount', 'user.sentMessages')
      .orderBy('user.messageCount', 'DESC')
      .limit(10)
      .getMany();
  }

  async countAllUsers() {
    return this.userRepository.count();
  }

  async bulkCreate(users: CreateUserDto[]): Promise<BulkCreateResult[]> {
    const results: BulkCreateResult[] = [];

    for (const user of users) {
      try {
        const { user: createdUser, token } = await this.createUser(user);
        results.push({
          user: {
            id: createdUser.id,
            email: createdUser.email,
            role: createdUser.role,
          },
          token,
        });
      } catch (e) {
        results.push({
          error: e instanceof Error ? e.message : 'Unknown error',
          user: user.email,
        });
      }
    }

    return results;
  }
}
