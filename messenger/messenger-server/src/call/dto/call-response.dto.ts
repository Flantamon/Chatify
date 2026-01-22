// src/call/dto/call-response.dto.ts
export class CallResponseDto {
  callId: string;
  from: number;
  to: number;
  status: 'accepted' | 'rejected' | 'ended';
  timestamp: Date;
}
