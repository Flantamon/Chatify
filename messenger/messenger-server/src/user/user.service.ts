/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from 'src/shared/enums/user-role.enum';
import { BulkCreateResult } from 'src/shared/types/bulkCreateResult.type';
import { GetUsersQueryDto } from './dto/get-users-query';

@Injectable()
export class UserService {
  constructor(
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
      throw new BadRequestException('This email already exists');
    }

    const hashedPassword = await argon2.hash(createUserDto.password);

    const user = await this.userRepository.save({
      name: createUserDto.name,
      email: createUserDto.email,
      password: hashedPassword,
      role: createUserDto.role,
      status: createUserDto.status ?? 'active',
      theme: createUserDto.theme,
      language: createUserDto.language,
    });

    const { password, ...userWithoutPassword } = user;

    const token = this.jwtService.sign({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return { user: userWithoutPassword, token };
  }

  async findByEmail(email: string) {
    return this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'name', 'password', 'role'],
    });
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

  async removeUser(id: number): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    await this.userRepository.remove(user);
    return { message: 'User deleted successfully' };
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

  async updateUserStatus(
    id: number,
    status: 'active' | 'blocked',
    currentUserRole: UserRole,
  ): Promise<User> {
    const targetUser = await this.userRepository.findOne({ where: { id } });

    if (!targetUser) {
      throw new BadRequestException('User not found');
    }

    if (!['active', 'blocked'].includes(status)) {
      throw new BadRequestException('Invalid status value');
    }

    const targetUserRole = targetUser.role as UserRole;

    if (
      currentUserRole === UserRole.ADMIN &&
      targetUserRole !== UserRole.USER
    ) {
      throw new ForbiddenException(
        'Admins can only change the status of users with role USER',
      );
    }

    await this.userRepository.update(id, { status });
    return this.userRepository.findOneByOrFail({ id });
  }

  async updateUserSettings(
    id: number,
    dto: { theme?: string; language?: string },
  ): Promise<User> {
    await this.userRepository.update(id, dto);
    return this.userRepository.findOneByOrFail({ id });
  }

  async updateUserRole(
    id: number,
    newRole: 'user' | 'admin',
    currentUserRole: UserRole,
  ): Promise<User> {
    const targetUser = await this.userRepository.findOne({ where: { id } });

    if (!targetUser) {
      throw new BadRequestException('User not found');
    }

    if (!['admin', 'user'].includes(newRole)) {
      throw new BadRequestException('Invalid role value');
    }

    const targetRole = targetUser.role as UserRole;

    if (
      currentUserRole === UserRole.MAIN_ADMIN &&
      targetRole === UserRole.MAIN_ADMIN
    ) {
      throw new ForbiddenException(
        'Main admin cannot change the role of another main admin',
      );
    }

    targetUser.role = newRole;
    await this.userRepository.save(targetUser);

    return targetUser;
  }

  async getUsersWithFilters(query: GetUsersQueryDto) {
    const {
      sortBy,
      sortDirection,
      roles,
      page = 1,
      limit = 10,
      countOnly,
      mostActiveOnly,
    } = query;

    console.log('Roles before transformation:', roles);

    // Преобразуем роли в массив
    let parsedRoles: string[] = [];

    // Если roles строка, то разделим по запятой
    if (typeof roles === 'string') {
      parsedRoles = roles.split(',').map((role) => role.trim());
    } else if (Array.isArray(roles)) {
      // Если roles массив, используем его как есть
      parsedRoles = roles;
    }

    // Проверка countOnly
    if (countOnly) {
      return this.userRepository.count(
        parsedRoles.length
          ? { where: parsedRoles.map((role) => ({ role })) }
          : {},
      );
    }

    // Проверка для mostActiveOnly
    if (mostActiveOnly) {
      return this.findMostActiveUsers();
    }

    // Строим запрос для получения пользователей
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.sentMessages', 'sentMessages')
      .loadRelationCountAndMap('user.messageCount', 'user.sentMessages');

    // Фильтрация по ролям
    if (parsedRoles.length > 0) {
      queryBuilder.where('user.role IN (:...roles)', { roles: parsedRoles });
    }

    // Сортировка
    if (sortBy === 'messages.count') {
      queryBuilder.orderBy('user.messageCount', sortDirection);
    } else if (sortBy) {
      queryBuilder.orderBy(`user.${sortBy}`, sortDirection);
    }

    // Пагинация
    queryBuilder.skip((page - 1) * limit).take(limit);

    // Выполнение запроса
    return queryBuilder.getMany();
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
