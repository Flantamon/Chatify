import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RequestWithUser } from 'src/shared/interfaces/user-request.interface';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { UserRole } from 'src/shared/enums/user-role.enum';
import { Roles } from 'src/shared/decorators/roles.decorator';

@UseGuards(JwtAuthGuard)
@Controller('contacts')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER)
  @Post()
  create(
    @Body() createContactDto: CreateContactDto,
    @Req() req: RequestWithUser,
  ) {
    return this.contactService.create(createContactDto, req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  findAll() {
    return this.contactService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contactService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateContactDto: UpdateContactDto) {
    return this.contactService.update(+id, updateContactDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contactService.remove(+id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER)
  @Get('user/me')
  getMyContacts(@Req() req: RequestWithUser) {
    return this.contactService.getUserContacts(req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER)
  @Get('user/search')
  searchContacts(
    @Req() req: RequestWithUser,
    @Query('search') search: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.contactService.searchContacts(
      req.user.id,
      search,
      +page,
      +limit,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('between-users/:userId')
  getContactBetweenUsers(
    @Param('userId') userId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.contactService.findContactBetweenUsers(req.user.id, +userId);
  }
}
