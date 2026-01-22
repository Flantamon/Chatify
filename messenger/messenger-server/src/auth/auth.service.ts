/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/require-await */
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { IUser } from './types/types';
// import axios from 'axios';
@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    try {
      const userWithRole = {
        ...createUserDto,
        role: 'user' as const,
      };

      return await this.userService.createUser(userWithRole);
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }

      throw new BadRequestException(
        'Произошла неизвестная ошибка. Пожалуйста, попробуйте снова.',
      );
    }
  }

  async validateUser(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) return null;

    // Проверяем статус пользователя
    if (user.status === 'blocked') {
      throw new ForbiddenException('К сожалению, вы не можете войти в систему. Ваш аккаунт был заблокирован');
    }

    const passwordIsMatch = await argon2.verify(user.password, password);

    if (passwordIsMatch) {
      return user;
    }
    throw new UnauthorizedException('User or password are incorrect!');
  }

  async login(user: IUser) {
    const { id, email, role } = user;
    const token = this.jwtService.sign({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    return {
      id,
      email,
      role,
      token,
    };
  }
}
