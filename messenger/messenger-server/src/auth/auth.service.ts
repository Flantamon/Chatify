/* eslint-disable @typescript-eslint/require-await */
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { IUser } from './types/types';
// import axios from 'axios';
import {
  AxiosErrorResponse,
  // RecaptchaResponse,
} from './interfaces/reCaptcha.interface';

console.log('RECAPTCHA_SECRET_KEY:', process.env.RECAPTCHA_SECRET_KEY);
console.log('RECAPTCHA_VERIFY_URL:', process.env.RECAPTCHA_VERIFY_URL);

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    try {
      // const response = await axios.post<RecaptchaResponse>(
      //   `${process.env.RECAPTCHA_VERIFY_URL}?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captcha}`,
      // );

      // if (!response.data.success) {
      //   throw new BadRequestException(
      //     'Неверный CAPTCHA. Пожалуйста, попробуйте снова.',
      //   );
      // }

      const userWithRole = {
        ...createUserDto,
        role: 'user' as const,
      };

      return await this.userService.createUser(userWithRole);
    } catch (error: unknown) {
      if (this.isAxiosError(error)) {
        const axiosError = error;
        throw new BadRequestException(
          axiosError.response?.data?.message || 'Ошибка при валидации CAPTCHA.',
        );
      }

      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }

      throw new BadRequestException(
        'Произошла неизвестная ошибка. Пожалуйста, попробуйте снова.',
      );
    }
  }

  private isAxiosError(error: unknown): error is AxiosErrorResponse {
    return typeof error === 'object' && error !== null && 'response' in error;
  }

  async validateUser(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) return null;

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
