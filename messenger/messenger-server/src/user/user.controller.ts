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
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UserRole } from 'src/shared/enums/user-role.enum';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @UsePipes(new ValidationPipe())
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.userService.createUser(createUserDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  async findAll() {
    return await this.userService.findAllUsers();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.userService.findOneUser(+id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return await this.userService.updateUser(+id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MAIN_ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.userService.removeUser(+id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id/block')
  async blockUser(@Param('id') id: string) {
    return await this.userService.updateUserStatus(+id, 'blocked');
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id/unblock')
  async unblockUser(@Param('id') id: string) {
    return await this.userService.updateUserStatus(+id, 'active');
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MAIN_ADMIN)
  @Get('admin-users')
  async getAdminAndUsers() {
    return await this.userService.findUsersByRoles([
      UserRole.USER,
      UserRole.ADMIN,
    ]);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MAIN_ADMIN)
  @Patch(':id/role')
  async changeRole(@Param('id') id: string, @Body('role') role: UserRole) {
    return await this.userService.updateUserRole(+id, role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MAIN_ADMIN)
  @Get('statistics/most-active')
  async getMostActiveUsers() {
    return await this.userService.findMostActiveUsers();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MAIN_ADMIN)
  @Get('statistics/total')
  async getUserCount() {
    return await this.userService.countAllUsers();
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
  @Post('import')
  async importUsers(@Body() users: CreateUserDto[]) {
    return await this.userService.bulkCreate(users);
  }
}
