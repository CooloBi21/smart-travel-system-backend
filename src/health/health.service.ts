import { Injectable } from '@nestjs/common';
import { HealthRepository } from './health.repository';

@Injectable()
export class HealthService {
  constructor(
    private readonly healthRepository: HealthRepository,
  ) {}

  async getHealth() {
    const database =
      await this.healthRepository.getDatabaseHealth();

    return {
      status: 'success',
      service: 'Smart Travel System API',
      architecture: 'NestJS V2',
      database: {
        status: 'up',
        name: database.database,
        serverVersion: database.serverVersion,
      },
    };
  }
}