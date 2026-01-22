/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
// src/call/call.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CallService } from './call.service';
import { CreateCallDto } from './dto/create-call.dto';

@Controller('calls')
@UseGuards(JwtAuthGuard)
export class CallController {
  constructor(private readonly callService: CallService) {}

  @Post('initiate')
  async initiateCall(@Body() createCallDto: CreateCallDto, @Request() req) {
    // Убедимся, что from соответствует текущему пользователю
    createCallDto.from = req.user.id;

    return this.callService.initiateCall(createCallDto);
  }

  @Post(':callId/accept')
  async acceptCall(@Param('callId') callId: string, @Request() req) {
    return this.callService.acceptCall(callId, req.user.id);
  }

  @Post(':callId/reject')
  async rejectCall(@Param('callId') callId: string, @Request() req) {
    return this.callService.rejectCall(callId, req.user.id);
  }

  @Post(':callId/end')
  async endCall(@Param('callId') callId: string, @Request() req) {
    return this.callService.endCall(callId, req.user.id);
  }

  @Get('history')
  async getUserCalls(@Request() req) {
    return this.callService.getUserCalls(req.user.id);
  }

  @Get('active')
  async getActiveCalls(@Request() req) {
    return this.callService.getActiveCalls(req.user.id);
  }

  @Get(':callId')
  async getCall(@Param('callId') callId: string, @Request() req) {
    return this.callService.getCallDetails(callId, req.user.id);
  }
}
