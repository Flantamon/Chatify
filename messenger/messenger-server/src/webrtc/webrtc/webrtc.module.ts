import { Module } from '@nestjs/common';
import { WebRTCService } from './webrtc.service';
import { WebRTCController } from './webrtc.controller';
import { WebRTCGateway } from './webrtc.gateway';

@Module({
  providers: [WebRTCService, WebRTCGateway],
  controllers: [WebRTCController],
})
export class WebRTCModule {}
