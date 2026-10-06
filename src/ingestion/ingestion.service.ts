import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import {
  IngestionRepository,
  IngestionRunRecord,
} from './repositories/ingestion.repository';
import { VietnamTourismDestinationAdapter } from './adapters/vietnam-tourism-destination.adapter';
import { NominatimGeocodingAdapter } from './adapters/nominatim-geocoding.adapter';

@Injectable()
export class IngestionService {
  private readonly sourceCode = 'VNTOURISM_DEST';

  constructor(
    private readonly ingestionRepository: IngestionRepository,
    private readonly destinationAdapter: VietnamTourismDestinationAdapter,
    private readonly nominatimAdapter: NominatimGeocodingAdapter,
  ) {}

  async ingestVietnamTourismPage(
    page = 1,
  ): Promise<IngestionRunRecord> {
    const source =
      await this.ingestionRepository.findActiveSourceByCode(
        this.sourceCode,
      );

    if (!source) {
      throw new Error(
        `Active external source "${this.sourceCode}" was not found.`,
      );
    }

    const run =
      await this.ingestionRepository.createIngestionRun(
        source.id,
      );

    let itemsFetched = 0;
    let itemsCreated = 0;
    let itemsUpdated = 0;
    let itemsUnchanged = 0;
    let itemsFailed = 0;

    try {
      const items =
        await this.destinationAdapter.fetchPage(page);

      itemsFetched = items.length;

      for (const item of items) {
        try {
          const contentHash =
            this.createContentHash({
              name: item.name,
              address: item.address,
              description: item.description,
            });

          const existing =
            await this.ingestionRepository.findExternalItemByExternalKey(
              source.id,
              item.externalKey,
            );

          const rawPayload = {
            externalKey: item.externalKey,
            sourceUrl: item.sourceUrl,
            name: item.name,
            address: item.address,
            description: item.description,
            rawHtml: item.rawHtml,
          };

          const normalizedPayload = {
            name: item.name,
            address: item.address,
            description: item.description,
          };

          if (!existing) {
            const created =
              await this.ingestionRepository.createExternalItem({
                sourceId: source.id,
                lastIngestionRunId: run.id,
                externalKey: item.externalKey,
                sourceUrl: item.sourceUrl,
                contentType: 'DESTINATION',
                rawPayload,
                contentHash,
              });

            await this.ingestionRepository.updateNormalizedPayload(
              created.id,
              normalizedPayload,
            );

            itemsCreated += 1;
            continue;
          }

          if (existing.contentHash === contentHash) {
            await this.ingestionRepository.updateExternalItem(
              existing.id,
              {
                lastIngestionRunId: run.id,
                rawPayload,
                contentHash,
                processingStatus: 'FETCHED',
              },
            );

            await this.ingestionRepository.updateNormalizedPayload(
              existing.id,
              normalizedPayload,
            );

            itemsUnchanged += 1;
            continue;
          }

          await this.ingestionRepository.updateExternalItem(
            existing.id,
            {
              lastIngestionRunId: run.id,
              rawPayload,
              contentHash,
              processingStatus: 'FETCHED',
            },
          );

          await this.ingestionRepository.updateNormalizedPayload(
            existing.id,
            normalizedPayload,
          );

          itemsUpdated += 1;
        } catch {
          itemsFailed += 1;
        }
      }

      const status =
        itemsFailed === 0 ? 'SUCCESS' : 'PARTIAL';

      return await this.ingestionRepository.finishIngestionRun(
        run.id,
        status,
        {
          itemsFetched,
          itemsCreated,
          itemsUpdated,
          itemsUnchanged,
          itemsFailed,
        },
      );
    } catch (error) {
      return await this.ingestionRepository.finishIngestionRun(
        run.id,
        'FAILED',
        {
          itemsFetched,
          itemsCreated,
          itemsUpdated,
          itemsUnchanged,
          itemsFailed,
        },
      );
    }
  }

  async ingestNominatimDestinations(): Promise<IngestionRunRecord> {
    const osmSource =
      await this.ingestionRepository.findActiveSourceByCode(
        'OSM_NOMINATIM',
      );

    if (!osmSource) {
      throw new Error(
        'Active external source "OSM_NOMINATIM" was not found.',
      );
    }

    const vietnamSource =
      await this.ingestionRepository.findActiveSourceByCode(
        'VNTOURISM_DEST',
      );

    if (!vietnamSource) {
      throw new Error(
        'Active external source "VNTOURISM_DEST" was not found.',
      );
    }

    const run =
      await this.ingestionRepository.createIngestionRun(
        osmSource.id,
      );

    let itemsFetched = 0;
    let itemsCreated = 0;
    let itemsUpdated = 0;
    let itemsUnchanged = 0;
    let itemsFailed = 0;

    try {
      const sourceItems =
        await this.ingestionRepository
          .findNormalizedDestinationItemsBySourceId(
            vietnamSource.id,
          );

      for (const sourceItem of sourceItems) {
        itemsFetched += 1;

        try {
          const payload = sourceItem.normalizedPayload;

          if (!payload) {
            itemsFailed += 1;
            continue;
          }

          const name =
            typeof payload.name === 'string'
              ? payload.name.trim()
              : '';

          const address =
            typeof payload.address === 'string'
              ? payload.address.trim()
              : '';

          if (!name || !address) {
            itemsFailed += 1;
            continue;
          }

          const geocoded =
            await this.nominatimAdapter.geocode(
              name,
              address,
            );

          /*
           * Không tìm thấy kết quả đủ tin cậy.
           * Không coi đây là system failure.
           */
          if (!geocoded) {
            continue;
          }

          if (
            !geocoded.osmType ||
            !geocoded.osmId === null
          ) {
            itemsFailed += 1;
            continue;
          }

          const externalKey =
            `${geocoded.osmType}:${geocoded.osmId}`;

          const sourceUrl =
            `https://www.openstreetmap.org/${geocoded.osmType}/${geocoded.osmId}`;

          const normalizedPayload = {
            name,
            latitude: geocoded.latitude,
            longitude: geocoded.longitude,
            displayName: geocoded.displayName,
            osmType: geocoded.osmType,
            osmId: geocoded.osmId,
            matchedQuery: geocoded.matchedQuery,
            vietnamTourismExternalItemId:
              sourceItem.id,
          };

          const rawPayload = {
            query: geocoded.matchedQuery,
            displayName: geocoded.displayName,
            latitude: geocoded.latitude,
            longitude: geocoded.longitude,
            osmType: geocoded.osmType,
            osmId: geocoded.osmId,
            vietnamTourismExternalItemId:
              sourceItem.id,
          };

          const contentHash =
            this.createContentHash(
              normalizedPayload,
            );

          const existing =
            await this.ingestionRepository
              .findExternalItemByExternalKey(
                osmSource.id,
                externalKey,
              );

          if (!existing) {
            const created =
              await this.ingestionRepository
                .createExternalItem({
                  sourceId: osmSource.id,
                  lastIngestionRunId: run.id,
                  externalKey,
                  sourceUrl,
                  contentType: 'DESTINATION',
                  rawPayload,
                  contentHash,
                });

            await this.ingestionRepository
              .updateNormalizedPayload(
                created.id,
                normalizedPayload,
              );

            itemsCreated += 1;
            continue;
          }

          if (existing.contentHash === contentHash) {
            await this.ingestionRepository
              .updateExternalItem(
                existing.id,
                {
                  lastIngestionRunId: run.id,
                  rawPayload,
                  contentHash,
                  processingStatus: 'FETCHED',
                },
              );

            await this.ingestionRepository
              .updateNormalizedPayload(
                existing.id,
                normalizedPayload,
              );

            itemsUnchanged += 1;
            continue;
          }

          await this.ingestionRepository
            .updateExternalItem(
              existing.id,
              {
                lastIngestionRunId: run.id,
                rawPayload,
                contentHash,
                processingStatus: 'FETCHED',
              },
            );

          await this.ingestionRepository
            .updateNormalizedPayload(
              existing.id,
              normalizedPayload,
            );

          itemsUpdated += 1;
        } catch {
          itemsFailed += 1;
        }
      }

      const status =
        itemsFailed === 0
          ? 'SUCCESS'
          : 'PARTIAL';

      return await this.ingestionRepository
        .finishIngestionRun(
          run.id,
          status,
          {
            itemsFetched,
            itemsCreated,
            itemsUpdated,
            itemsUnchanged,
            itemsFailed,
          },
        );
    } catch {
      return await this.ingestionRepository
        .finishIngestionRun(
          run.id,
          'FAILED',
          {
            itemsFetched,
            itemsCreated,
            itemsUpdated,
            itemsUnchanged,
            itemsFailed,
          },
        );
    }
  }

  private createContentHash(
    value: Record<string, unknown>,
  ): string {
    return createHash('sha256')
      .update(JSON.stringify(value))
      .digest('hex');
  }
}
