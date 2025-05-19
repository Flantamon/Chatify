import {
  Controller,
  Get,
  Param,
  NotFoundException,
  StreamableFile,
  Res,
} from '@nestjs/common';
import { MessageService } from './message.service';
import * as path from 'path';
import * as fs from 'fs';
import { Response } from 'express';

@Controller('uploads/messages')
export class UploadsController {
  constructor(private readonly messageService: MessageService) {}

  @Get(':fileName')
  async getFile(
    @Param('fileName') fileName: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const message = await this.messageService.findMessageByFileName(fileName);

    if (!message || !message.fileUrl) {
      throw new NotFoundException('File not found');
    }

    const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'messages');
    const filePath = path.join(uploadDir, path.basename(message.fileUrl));

    try {
      const file = fs.createReadStream(filePath);
      res.set({
        'Content-Type': message.fileType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${message.fileName}"`,
      });
      return new StreamableFile(file);
    } catch (error) {
      console.error('Error reading file:', error);
      throw new NotFoundException('File not found');
    }
  }
}
