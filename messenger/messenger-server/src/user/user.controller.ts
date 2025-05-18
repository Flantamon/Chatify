import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  Get,
  Param,
  Patch,
  Delete,
  Request,
  UseGuards,
  ForbiddenException,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UserRole } from 'src/shared/enums/user-role.enum';
import { GetUsersQueryDto } from './dto/get-users-query';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';
import { RolesGuard } from 'src/shared/guards/roles.guard';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @UsePipes(new ValidationPipe())
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.userService.createUser(createUserDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MAIN_ADMIN, UserRole.ADMIN, UserRole.USER)
  @Get()
  async getUsers(
    @Query() query: GetUsersQueryDto,
    @Request() req: Request & { user: JwtPayload },
  ) {
    const currentUser = req.user;
    const { page = 1, limit = 10 } = query;

    try {
      if (query.searchTerm) {
        return await this.userService.getUsersWithFilters(query);
      }

      if (currentUser.role === UserRole.MAIN_ADMIN) {
        return await this.userService.findAllUsersWithPagination(page, limit);
      }

      if (currentUser.role === UserRole.ADMIN) {
        return await this.userService.findAllUsersByRoleWithPagination(
          UserRole.USER,
          page,
          limit,
        );
      }

      if (currentUser.role === UserRole.USER) {
        return [await this.userService.findOneUser(currentUser.id)];
      }

      return await this.userService.getUsersWithFilters(query);
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new HttpException(
        'Error fetching users',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MAIN_ADMIN)
  @Get('count')
  async getUserCount() {
    const count = await this.userService.countAllUsers();
    return { count };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MAIN_ADMIN)
  @Get('export')
  async exportUsers() {
    const users = await this.userService.findAllUsers();
    return { exported: users };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MAIN_ADMIN)
  @Get('most-active')
  async getMostActiveUsers(
    @Request() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return await this.userService.findMostActiveUsers(page, limit);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.userService.findOneUser(+id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MAIN_ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.userService.removeUser(+id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER, UserRole.ADMIN, UserRole.MAIN_ADMIN)
  @Patch(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Request() req: { user: { id: number; role: UserRole } },
  ) {
    const userId = +id;
    const { id: currentUserId, role } = req.user;

    if (role === UserRole.USER) {
      if (currentUserId !== userId) {
        throw new ForbiddenException('You can only update your own profile');
      }

      const { theme, language, ...rest } = dto;
      if (Object.keys(rest).length > 0) {
        throw new ForbiddenException('You can only update theme and language');
      }
      return this.userService.updateUserSettings(
        userId,
        { theme, language },
        role,
      );
    }

    if (role === UserRole.ADMIN) {
      const { status, ...rest } = dto;

      if (Object.keys(rest).length > 0 || !status) {
        throw new ForbiddenException('Admins can only update user status');
      }

      return this.userService.updateUserStatus(userId, status, role);
    }

    if (role === UserRole.MAIN_ADMIN) {
      const { role: newRole, ...rest } = dto;
      if (Object.keys(rest).length > 0 || !newRole) {
        throw new ForbiddenException('Main admins can only update user role');
      }
      return this.userService.updateUserRole(userId, newRole, role);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MAIN_ADMIN)
  @Post('import')
  async importUsers(@Body() users: CreateUserDto[]) {
    return await this.userService.bulkCreate(users);
  }
}
