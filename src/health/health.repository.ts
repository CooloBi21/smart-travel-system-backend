import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

interface DatabaseHealth {
  database: string;
  serverVersion: string;
}

@Injectable()
export class HealthRepository {
  constructor(
    private readonly databaseService: DatabaseService,
  ) {}

  async getDatabaseHealth(): Promise<DatabaseHealth> {
    const result = await this.databaseService.query<{
      database_name: string;
      server_version: string;
    }>(`
      SELECT
        current_database() AS database_name,
        current_setting('server_version') AS server_version
    `);

    const connection = result.rows[0];

    if (!connection) {
      throw new Error(
        'PostgreSQL health check returned no data.',
      );
    }

    return {
      database: connection.database_name,
      serverVersion: connection.server_version,
    };
  }
}
