// src/call/call.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventsGateway } from '../events/events.gateway';
import { User } from '../user/entities/user.entity';
import { Call } from './entities/call.entity';
import { CreateCallDto } from './dto/create-call.dto';

@Injectable()
export class CallService {
  constructor(
    @InjectRepository(Call)
    private readonly callRepository: Repository<Call>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly eventsGateway: EventsGateway, // Теперь это должно работать
  ) {}

  // Запрос на звонок
  async initiateCall(createCallDto: CreateCallDto): Promise<Call> {
    const { from, to, callerName, callType = 'video' } = createCallDto;

    // Проверяем существование пользователей
    const caller = await this.userRepository.findOne({ where: { id: from } });
    const receiver = await this.userRepository.findOne({ where: { id: to } });

    if (!caller) {
      throw new NotFoundException('Caller not found');
    }

    if (!receiver) {
      throw new NotFoundException('Receiver not found');
    }

    // Создаем запись о звонке
    const call = this.callRepository.create({
      caller,
      receiver,
      callType,
      status: 'pending',
      startedAt: new Date(),
    });

    const savedCall = await this.callRepository.save(call);

    // Отправляем уведомление через WebSocket
    this.eventsGateway.sendCallRequest({
      callId: savedCall.id,
      from: caller.id,
      to: receiver.id,
      caller: {
        id: caller.id,
        name: caller.name || callerName || `User ${caller.id}`,
      },
      callType,
      timestamp: savedCall.startedAt,
    });

    return savedCall;
  }

  // Принятие звонка
  async acceptCall(callId: string, responderId: number): Promise<Call> {
    const call = await this.callRepository.findOne({
      where: { id: callId },
      relations: ['caller', 'receiver'],
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    if (call.receiver.id !== responderId) {
      throw new NotFoundException('You are not the receiver of this call');
    }

    // Обновляем статус звонка
    call.status = 'accepted';
    call.answeredAt = new Date();

    const updatedCall = await this.callRepository.save(call);

    // Отправляем подтверждение через WebSocket
    this.eventsGateway.sendCallAccepted({
      callId: call.id,
      from: responderId,
      to: call.caller.id,
      status: 'accepted',
    });

    return updatedCall;
  }

  // Отклонение звонка
  async rejectCall(callId: string, responderId: number): Promise<Call> {
    const call = await this.callRepository.findOne({
      where: { id: callId },
      relations: ['caller', 'receiver'],
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    if (call.receiver.id !== responderId) {
      throw new NotFoundException('You are not the receiver of this call');
    }

    call.status = 'rejected';
    call.endedAt = new Date();

    const updatedCall = await this.callRepository.save(call);

    // Отправляем отклонение через WebSocket
    this.eventsGateway.sendCallRejected({
      callId: call.id,
      from: responderId,
      to: call.caller.id,
      status: 'rejected',
    });

    return updatedCall;
  }

  // Завершение звонка
  async endCall(callId: string, userId: number): Promise<Call> {
    const call = await this.callRepository.findOne({
      where: { id: callId },
      relations: ['caller', 'receiver'],
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    if (call.caller.id !== userId && call.receiver.id !== userId) {
      throw new NotFoundException('You are not a participant of this call');
    }

    call.status = 'ended';
    call.endedAt = new Date();

    // Вычисляем длительность
    if (call.answeredAt) {
      call.duration = Math.floor(
        (call.endedAt.getTime() - call.answeredAt.getTime()) / 1000,
      );
    }

    const updatedCall = await this.callRepository.save(call);

    // Отправляем уведомление о завершении
    const partnerId =
      call.caller.id === userId ? call.receiver.id : call.caller.id;

    this.eventsGateway.sendCallEnded({
      callId: call.id,
      from: userId,
      to: partnerId,
      status: 'ended',
    });

    return updatedCall;
  }

  // Получение истории звонков пользователя
  async getUserCalls(userId: number): Promise<Call[]> {
    return this.callRepository.find({
      where: [{ caller: { id: userId } }, { receiver: { id: userId } }],
      relations: ['caller', 'receiver'],
      order: { startedAt: 'DESC' },
    });
  }

  // Получение активных звонков пользователя
  async getActiveCalls(userId: number): Promise<Call[]> {
    return this.callRepository.find({
      where: [
        { caller: { id: userId }, status: 'accepted' },
        { receiver: { id: userId }, status: 'accepted' },
      ],
      relations: ['caller', 'receiver'],
    });
  }

  // Получение деталей звонка
  async getCallDetails(callId: string, userId: number): Promise<Call> {
    const call = await this.callRepository.findOne({
      where: { id: callId },
      relations: ['caller', 'receiver'],
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    if (call.caller.id !== userId && call.receiver.id !== userId) {
      throw new NotFoundException('You are not a participant of this call');
    }

    return call;
  }

  // Проверка, есть ли у пользователя активный звонок
  async hasActiveCall(userId: number): Promise<boolean> {
    const activeCalls = await this.getActiveCalls(userId);
    return activeCalls.length > 0;
  }

  // Пропущенный звонок (автоматически, если получатель не ответил)
  async markAsMissed(callId: string): Promise<Call> {
    const call = await this.callRepository.findOne({
      where: { id: callId },
      relations: ['caller', 'receiver'],
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    call.status = 'missed';
    call.endedAt = new Date();

    return this.callRepository.save(call);
  }
}
