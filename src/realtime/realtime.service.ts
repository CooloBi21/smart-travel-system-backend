import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class RealtimeService {
  private server: Server | null = null;

  setServer(server: Server): void {
    this.server = server;
  }

  emitToUser(
    userId: number,
    event: string,
    data: unknown,
  ): void {
    if (!this.server) {
      return;
    }

    this.server
      .to(`user:${userId}`)
      .emit(event, data);
  }

  emitToUsers(
    userIds: number[],
    event: string,
    data: unknown,
  ): void {
    if (!this.server) {
      return;
    }

    for (const userId of userIds) {
      this.emitToUser(userId, event, data);
    }
  }
}
