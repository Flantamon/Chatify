import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebRTCConfig } from 'src/config';

@Injectable()
export class WebRTCService {
  private readonly iceServers: RTCIceServer[];

  constructor(private readonly configService: ConfigService) {
    const webRTCConfig = this.configService.get<WebRTCConfig>('webRTCConfig')!;
    if (!webRTCConfig) {
      throw new Error('WebRTC configuration is missing');
    }
    this.iceServers = webRTCConfig.iceServers;
  }

  getIceServers() {
    return this.iceServers;
  }
}
