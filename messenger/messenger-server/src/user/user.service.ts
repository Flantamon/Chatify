/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from 'src/shared/enums/user-role.enum';
import { BulkCreateResult } from 'src/shared/types/bulkCreateResult.type';
import { GetUsersQueryDto } from './dto/get-users-query';
import { UserPaginationResponse } from 'src/shared/interfaces/user-request.interface';

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

  async findAllUsersByRole(role: UserRole): Promise<User[]> {
    return await this.userRepository.find({ where: { role } });
  }

  async findAllUsersWithPagination(
    page: number,
    limit: number,
  ): Promise<UserPaginationResponse> {
    const [users, total] = await this.userRepository.findAndCount({
      where: { role: Not(UserRole.MAIN_ADMIN) },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      users,
      totalCount: total,
    };
  }

  async findAllUsersByRoleWithPagination(
    role: UserRole,
    page: number,
    limit: number,
  ): Promise<UserPaginationResponse> {
    const [users, total] = await this.userRepository.findAndCount({
      where: { role },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      users,
      totalCount: total,
    };
  }

  async findOneUser(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return user;
  }

  async findMostActiveUsers(
    page: number,
    limit: number,
  ): Promise<UserPaginationResponse> {
    const [users, total] = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.sentMessages', 'sentMessages')
      .loadRelationCountAndMap('user.messageCount', 'user.sentMessages')
      .where('user.role != :role', { role: UserRole.MAIN_ADMIN })
      .orderBy('user.messageCount', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      users,
      totalCount: total,
    };
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
    currentUserRole: UserRole,
  ): Promise<User> {
    const targetUser = await this.userRepository.findOne({ where: { id } });

    if (!targetUser) {
      throw new BadRequestException('User not found');
    }

    const validThemes = ['light', 'dark'];
    const validLanguages = ['en', 'ru'];

    if (dto.theme && !validThemes.includes(dto.theme)) {
      throw new BadRequestException('Invalid theme value');
    }

    if (dto.language && !validLanguages.includes(dto.language)) {
      throw new BadRequestException('Invalid language value');
    }

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

  //TODO
  async getUsersWithFilters(query: GetUsersQueryDto) {
    console.log('Query received in getUsersWithFilters:', query);

    if (!query) {
      throw new Error('Query is undefined');
    }

    const {
      sortBy,
      sortDirection,
      roles,
      page = 1,
      limit = 10,
      countOnly,
      searchTerm,
    } = query;

    console.log('Roles before transformation:', roles);

    let parsedRoles: string[] = [];
    if (roles) {
      if (typeof roles === 'string') {
        parsedRoles = roles.split(',').map((role) => role.trim());
      } else if (Array.isArray(roles)) {
        parsedRoles = roles;
      }
    }

    if (countOnly) {
      return this.userRepository.count(
        parsedRoles.length
          ? { where: parsedRoles.map((role) => ({ role })) }
          : {},
      );
    }

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.sentMessages', 'sentMessages')
      .loadRelationCountAndMap('user.messageCount', 'user.sentMessages');

    if (parsedRoles.length > 0) {
      queryBuilder.andWhere('user.role IN (:...roles)', { roles: parsedRoles });
    }

    if (searchTerm) {
      queryBuilder.andWhere('user.name LIKE :name', {
        name: `%${searchTerm}%`,
      });
    }

    if (sortBy) {
      if (sortBy === 'messages.count') {
        queryBuilder.orderBy('user.messageCount', sortDirection);
      } else {
        queryBuilder.orderBy(`user.${sortBy}`, sortDirection);
      }
    }

    queryBuilder.skip((page - 1) * limit).take(limit);

    return queryBuilder.getMany();
  }

  async countAllUsers(): Promise<number> {
    return await this.userRepository.count({ where: { role: UserRole.USER } });
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
