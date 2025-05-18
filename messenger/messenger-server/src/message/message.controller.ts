import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Patch,
  Delete,
  Request,
  Query,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { MessageService } from './message.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UpdateMessageDto } from './dto/update-message.dto';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { UserRole } from 'src/shared/enums/user-role.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { RequestWithUser } from 'src/shared/interfaces/user-request.interface';

@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER)
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  create(
    @UploadedFile() file: Express.Multer.File,
    @Body() createMessageDto: CreateMessageDto,
    @Request() req: RequestWithUser,
  ) {
    console.log('Received file:', file);
    console.log('Received DTO:', createMessageDto);

    if (
      !createMessageDto.receiverUserId &&
      !createMessageDto.receiverChannelId
    ) {
      console.error(
        'Missing receiverUserId or receiverChannelId in DTO:',
        createMessageDto,
      );
    }

    return this.messageService.create(createMessageDto, req.user.id, file);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER)
  @Get()
  findConversationMessages(
    @Request() req: RequestWithUser,
    @Query('receiverUserId') receiverUserId?: string,
    @Query('receiverChannelId') receiverChannelId?: string,
  ) {
    const senderId = req.user.id;

    if (receiverUserId && receiverChannelId) {
      throw new BadRequestException(
        'Provide either receiverUserId or receiverChannelId, not both.',
      );
    }
    if (!receiverUserId && !receiverChannelId) {
      throw new BadRequestException(
        'Provide either receiverUserId or receiverChannelId.',
      );
    }

    if (receiverUserId) {
      return this.messageService.findConversationMessages(
        senderId,
        +receiverUserId,
      );
    } else {
      return this.messageService.findChannelMessages(+receiverChannelId!);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('all')
  findAllAdmin() {
    return this.messageService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMessageDto: UpdateMessageDto) {
    return this.messageService.update(+id, updateMessageDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.messageService.remove(+id);
  }
}
