import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  DestinationsRepository,
  DestinationRecord,
} from './repositories/destinations.repository';

import { DatabaseService } from '../database/database.service';
import { IngestionRepository } from '../ingestion/repositories/ingestion.repository';

export interface ApplyDestinationInput {
  name: string;
  description: string | null;
  locationName: string;
  latitude: number;
  longitude: number;
  externalItemId: number;
}

@Injectable()
export class DestinationsService {
  constructor(
    private readonly destinationsRepository: DestinationsRepository,
    private readonly databaseService: DatabaseService,
    private readonly ingestionRepository: IngestionRepository,
  ) {}

  async getById(
    id: number,
  ): Promise<DestinationRecord> {
    const destination =
      await this.destinationsRepository.findById(id);

    if (!destination) {
      throw new NotFoundException(
        'Destination not found.',
      );
    }

    return destination;
  }

  async validateExternalItem(
    externalItemId: number,
  ) {
    const item =
      await this.ingestionRepository.findExternalItemForApply(
        externalItemId,
      );

    if (!item) {
      throw new NotFoundException(
        `External item ${externalItemId} not found.`,
      );
    }

    if (item.contentType !== 'DESTINATION') {
      throw new Error(
        `External item ${externalItemId} is not a DESTINATION item.`,
      );
    }

    if (item.processingStatus !== 'NORMALIZED') {
      throw new Error(
        `External item ${externalItemId} is not ready for destination apply.`,
      );
    }

    if (!item.normalizedPayload) {
      throw new Error(
        `External item ${externalItemId} has no normalized payload.`,
      );
    }

    return item;
  }

  private slugify(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async applyExternalDestination(
    externalItemId: number,
  ): Promise<DestinationRecord> {
    const externalItem =
      await this.ingestionRepository.findExternalItemForApply(
        externalItemId,
      );

    if (!externalItem) {
      throw new Error(
        `External item ${externalItemId} was not found.`,
      );
    }

    if (externalItem.contentType !== 'DESTINATION') {
      throw new Error(
        `External item ${externalItemId} is not a DESTINATION.`,
      );
    }

    if (externalItem.processingStatus !== 'NORMALIZED') {
      throw new Error(
        `External item ${externalItemId} is not ready for apply.`,
      );
    }

    const payload = externalItem.normalizedPayload;

    if (!payload) {
      throw new Error(
        `External item ${externalItemId} has no normalized payload.`,
      );
    }

    const name =
      typeof payload.name === 'string'
        ? payload.name.trim()
        : '';

    const latitude = Number(payload.latitude);
    const longitude = Number(payload.longitude);

    const displayName =
      typeof payload.displayName === 'string'
        ? payload.displayName.trim()
        : '';

    if (!name) {
      throw new Error(
        `External item ${externalItemId} has no valid name.`,
      );
    }

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      throw new Error(
        `External item ${externalItemId} has invalid coordinates.`,
      );
    }

    if (
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      throw new Error(
        `External item ${externalItemId} has coordinates out of range.`,
      );
    }

    const destination = await this.applyDestination({
      name,
      description: null,
      locationName: displayName || name,
      latitude,
      longitude,
      externalItemId,
    });

    await this.ingestionRepository.markExternalItemApplied(
      externalItemId,
    );

    return destination;
  }

  async applyDestination(
    input: ApplyDestinationInput,
  ): Promise<DestinationRecord> {
    await this.validateExternalItem(input.externalItemId);

    if (
      !Number.isFinite(input.latitude) ||
      input.latitude < -90 ||
      input.latitude > 90
    ) {
      throw new Error(
        `Invalid latitude: ${input.latitude}`,
      );
    }

    if (
      !Number.isFinite(input.longitude) ||
      input.longitude < -180 ||
      input.longitude > 180
    ) {
      throw new Error(
        `Invalid longitude: ${input.longitude}`,
      );
    }

    const slug = this.slugify(input.name);

    if (!slug) {
      throw new Error(
        `Unable to generate destination slug from "${input.name}".`,
      );
    }

    return this.databaseService.withTransaction(
      async (client) => {
        const existingResult =
          await client.query<DestinationRecord>(
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

        const existing = existingResult.rows[0];

        let destination: DestinationRecord;

        if (existing) {
          const updatedResult =
            await client.query<DestinationRecord>(
              `
              UPDATE destinations
              SET
                name = $2,
                description = $3,
                location_name = $4,
                latitude = $5,
                longitude = $6
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
                existing.id,
                input.name,
                input.description,
                input.locationName,
                input.latitude,
                input.longitude,
              ],
            );

          const updated = updatedResult.rows[0];

          if (!updated) {
            throw new Error(
              'Destination update returned no record.',
            );
          }

          destination = updated;
        } else {
          const createdResult =
            await client.query<DestinationRecord>(
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
                'ACTIVE'
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
                input.name,
                slug,
                input.description,
                input.locationName,
                input.latitude,
                input.longitude,
              ],
            );

          const created = createdResult.rows[0];

          if (!created) {
            throw new Error(
              'Destination creation returned no record.',
            );
          }

          destination = created;
        }

        await client.query(
          `
          INSERT INTO destination_sources (
            destination_id,
            external_item_id,
            is_primary
          )
          VALUES ($1, $2, TRUE)
          ON CONFLICT (destination_id, external_item_id)
          DO UPDATE SET
            last_seen_at = NOW(),
            last_verified_at = NOW()
          `,
          [
            destination.id,
            input.externalItemId,
          ],
        );

        return destination;
      },
    );
  }
}
