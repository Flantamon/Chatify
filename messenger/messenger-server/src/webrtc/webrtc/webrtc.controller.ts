import { Controller, Get } from '@nestjs/common';
import { WebRTCService } from './webrtc.service';

@Controller('webrtc')
export class WebRTCController {
  constructor(private readonly webRTCService: WebRTCService) {}

  @Get('ice-servers')
  getIceServers() {
    return this.webRTCService.getIceServers();
  }
}
