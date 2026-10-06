import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export interface DestinationRecord {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  locationName: string;
  latitude: number;
  longitude: number;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
}

export interface CreateDestinationData {
  name: string;
  slug: string;
  description: string | null;
  locationName: string;
  latitude: number;
  longitude: number;
  status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
}

export interface UpdateDestinationData {
  name?: string;
  slug?: string;
  description?: string | null;
  locationName?: string;
  latitude?: number;
  longitude?: number;
  status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
}

@Injectable()
export class DestinationsRepository {
  constructor(
    private readonly databaseService: DatabaseService,
  ) {}

  async findById(
    id: number,
  ): Promise<DestinationRecord | null> {
    const result =
      await this.databaseService.query<DestinationRecord>(
        `
        SELECT
          id,
          name,
          slug,
          description,
          location_name AS "locationName",
          latitude::double precision AS latitude,
          longitude::double precision AS longitude,
          status,
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM destinations
        WHERE id = $1
        LIMIT 1
        `,
        [id],
      );

    return result.rows[0] ?? null;
  }

  async findBySlug(
    slug: string,
  ): Promise<DestinationRecord | null> {
    const result =
      await this.databaseService.query<DestinationRecord>(
        `
        SELECT
          id,
          name,
          slug,
          description,
          location_name AS "locationName",
          latitude::double precision AS latitude,
          longitude::double precision AS longitude,
          status,
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM destinations
        WHERE slug = $1
        LIMIT 1
        `,
        [slug],
      );

    return result.rows[0] ?? null;
  }

  async findByName(
    name: string,
  ): Promise<DestinationRecord | null> {
    const result =
      await this.databaseService.query<DestinationRecord>(
        `
        SELECT
          id,
          name,
          slug,
          description,
          location_name AS "locationName",
          latitude::double precision AS latitude,
          longitude::double precision AS longitude,
          status,
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM destinations
        WHERE name = $1
        LIMIT 1
        `,
        [name],
      );

    return result.rows[0] ?? null;
  }

  async create(
    data: CreateDestinationData,
  ): Promise<DestinationRecord> {
    const result =
      await this.databaseService.query<DestinationRecord>(
        `
        INSERT INTO destinations (
          name,
          slug,
          description,
          location_name,
          latitude,
          longitude,
          status
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          COALESCE($7, 'ACTIVE')
        )
        RETURNING
          id,
          name,
          slug,
          description,
          location_name AS "locationName",
          latitude::double precision AS latitude,
          longitude::double precision AS longitude,
          status,
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        `,
        [
          data.name,
          data.slug,
          data.description,
          data.locationName,
          data.latitude,
          data.longitude,
          data.status ?? null,
        ],
      );

    const destination = result.rows[0];

    if (!destination) {
      throw new Error(
        'Destination creation returned no record.',
      );
    }

    return destination;
  }

  async update(
    id: number,
    data: UpdateDestinationData,
  ): Promise<DestinationRecord | null> {
    const result =
      await this.databaseService.query<DestinationRecord>(
        `
        UPDATE destinations
        SET
          name = COALESCE($2, name),
          slug = COALESCE($3, slug),
          description = COALESCE($4, description),
          location_name = COALESCE($5, location_name),
          latitude = COALESCE($6, latitude),
          longitude = COALESCE($7, longitude),
          status = COALESCE($8, status)
        WHERE id = $1
        RETURNING
          id,
          name,
          slug,
          description,
          location_name AS "locationName",
          latitude::double precision AS latitude,
          longitude::double precision AS longitude,
          status,
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        `,
        [
          id,
          data.name ?? null,
          data.slug ?? null,
          data.description ?? null,
          data.locationName ?? null,
          data.latitude ?? null,
          data.longitude ?? null,
          data.status ?? null,
        ],
      );

    return result.rows[0] ?? null;
  }
}
