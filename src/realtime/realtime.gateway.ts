import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';
import { RealtimeService } from './realtime.service';

interface JwtPayload {
  sub: number;
  email: string;
  roleCode: string;
}

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
    private readonly realtimeService: RealtimeService,
  ) {}

  afterInit(server: Server): void {
    this.realtimeService.setServer(server);
  }

  async handleConnection(
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    try {
      const token = this.extractToken(client);

      if (!token) {
        client.disconnect();
        return;
      }

      const payload =
        await this.jwtService.verifyAsync<JwtPayload>(token);

      if (
        !Number.isInteger(payload.sub) ||
        payload.sub <= 0
      ) {
        client.disconnect();
        return;
      }

      await this.authService.getProfile(payload.sub);

      client.data.user = payload;

      await client.join(`user:${payload.sub}`);

      this.logger.log(
        `WebSocket connected: user=${payload.sub}`,
      );
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(
    @ConnectedSocket() client: Socket,
  ): void {
    const userId = client.data?.user?.sub;

    this.logger.log(
      `WebSocket disconnected: user=${
        userId ?? 'unknown'
      }`,
    );
  }

  private extractToken(client: Socket): string | null {
    const authToken = client.handshake.auth?.token;

    if (
      typeof authToken === 'string' &&
      authToken.trim()
    ) {
      return authToken.trim();
    }

    const authorization =
      client.handshake.headers.authorization;

    if (
      typeof authorization === 'string' &&
      authorization.startsWith('Bearer ')
    ) {
      return authorization
        .slice(7)
        .trim();
    }

    return null;
  }
}
