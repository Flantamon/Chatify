import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
  Request,
} from '@nestjs/common';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';
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
  @Roles(UserRole.USER)
  @Get()
  async findAll(@Req() req: RequestWithUser) {
    return this.contactService.findAll(req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contactService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER)
  @Delete()
  remove(
    @Body() removeContactDto: CreateContactDto,
    @Request() req: RequestWithUser,
  ) {
    return this.contactService.remove(removeContactDto.userId, req.user.id);
  }
}
