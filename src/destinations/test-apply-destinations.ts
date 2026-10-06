import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { IngestionRepository } from '../ingestion/repositories/ingestion.repository';
import { DestinationsService } from './destinations.service';
import { DatabaseService } from '../database/database.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const ingestionRepository =
      app.get(IngestionRepository);

    const destinationsService =
      app.get(DestinationsService);

    const databaseService = app.get(DatabaseService);

    const debug = await databaseService.query(`
      SELECT
        current_database() AS database_name,
        current_user AS database_user,
        inet_server_addr() AS server_address,
        inet_server_port() AS server_port,
        COUNT(*) FILTER (
          WHERE source_id = 2
            AND content_type = 'DESTINATION'
            AND processing_status = 'NORMALIZED'
            AND normalized_payload IS NOT NULL
        ) AS normalized_destination_count
      FROM public.external_items;
    `);

    console.log('RUNTIME DATABASE CHECK:', debug.rows[0]);

    const source =
      await ingestionRepository.findActiveSourceByCode(
        'OSM_NOMINATIM',
      );

    if (!source) {
      throw new Error(
        'Active external source "OSM_NOMINATIM" was not found.',
      );
    }

    console.log('RUNTIME SOURCE:', source);

    const validatedExternalItemIds = new Set([
      16,
      17,
      21,
      22,
      23,
    ]);

    const allItems =
      await ingestionRepository.findNormalizedDestinationItemsBySourceId(
        source.id,
      );

    console.log(
      'REPOSITORY ITEMS:',
      allItems.map((item) => ({
        id: item.id,
        sourceId: item.sourceId,
        contentType: item.contentType,
        processingStatus: item.processingStatus,
      })),
    );

    const items = allItems.filter((item) =>
      validatedExternalItemIds.has(Number(item.id)),
    );

    console.log(
      'VALIDATED ITEMS:',
      items.map((item) => item.id),
    );

    let applied = 0;
    let skipped = 0;
    let failed = 0;

    for (const item of items) {
      if (item.processingStatus !== 'NORMALIZED') {
        skipped += 1;
        continue;
      }

      const payload = item.normalizedPayload;

      if (!payload) {
        skipped += 1;
        continue;
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

      if (
        !name ||
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
      ) {
        skipped += 1;
        continue;
      }

      try {
        await destinationsService.applyDestination({
          name,
          description: null,
          locationName: displayName || name,
          latitude,
          longitude,
          externalItemId: item.id,
        });

        await ingestionRepository.markExternalItemApplied(
          item.id,
        );

        applied += 1;

        console.log(
          `APPLIED: ${item.id} -> ${name}`,
        );
      } catch (error) {
        failed += 1;

        console.error(
          `FAILED: ${item.id} -> ${name}`,
          error,
        );
      }
    }

    console.log(
      JSON.stringify(
        {
          sourceId: source.id,
          itemsProcessed: items.length,
          applied,
          skipped,
          failed,
        },
        null,
        2,
      ),
    );
  } finally {
    await app.close();
  }
}

bootstrap().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
