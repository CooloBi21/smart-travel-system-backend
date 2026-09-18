import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Pool,
  PoolClient,
  QueryResult,
  QueryResultRow,
} from 'pg';

@Injectable()
export class DatabaseService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(DatabaseService.name);

  private readonly pool: Pool;

  private readonly expectedDatabaseName: string;

  constructor(
    private readonly configService: ConfigService,
  ) {
    const user =
      this.configService.getOrThrow<string>('DB_USER');

    const host =
      this.configService.getOrThrow<string>('DB_HOST');

    const password =
      this.configService.getOrThrow<string>('DB_PASSWORD');

    this.expectedDatabaseName =
      this.configService.getOrThrow<string>('DB_TARGET_NAME');

    const port = Number(
      this.configService.get<string>('DB_PORT') ?? 5432,
    );

    if (!Number.isInteger(port) || port <= 0) {
      throw new Error(
        'DB_PORT must be a valid positive integer.',
      );
    }

    this.pool = new Pool({
      user,
      host,
      database: this.expectedDatabaseName,
      password,
      port,
    });

    this.pool.on('error', (error: Error) => {
      this.logger.error(
        'Unexpected PostgreSQL pool error.',
        error.stack,
      );
    });
  }

  async onModuleInit(): Promise<void> {
    const result = await this.pool.query<{
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
        'PostgreSQL connection verification returned no data.',
      );
    }

    if (
      connection.database_name !==
      this.expectedDatabaseName
    ) {
      throw new Error(
        `Database safety check failed. Expected "${this.expectedDatabaseName}" ` +
          `but connected to "${connection.database_name}".`,
      );
    }

    this.logger.log(
      `Connected to PostgreSQL database "${connection.database_name}" ` +
        `(server ${connection.server_version}).`,
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();

    this.logger.log('PostgreSQL pool closed.');
  }

  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params: readonly unknown[] = [],
  ): Promise<QueryResult<T>> {
    return this.pool.query<T>(
      text,
      [...params],
    );
  }

  async withTransaction<T>(
    operation: (client: PoolClient) => Promise<T>,
  ): Promise<T> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const result = await operation(client);

      await client.query('COMMIT');

      return result;
    } catch (error) {
      await client.query('ROLLBACK');

      throw error;
    } finally {
      client.release();
    }
  }
}