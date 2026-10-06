import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export interface ExternalSourceRecord {
  id: number;
  code: string;
  name: string;
  sourceType: string;
  baseUrl: string;
  isActive: boolean;
  crawlIntervalMinutes: number;
  maxStalenessMinutes: number;
}

export type IngestionRunStatus =
  | 'RUNNING'
  | 'SUCCESS'
  | 'PARTIAL'
  | 'FAILED';

export interface IngestionRunRecord {
  id: number;
  sourceId: number;
  startedAt: string;
  finishedAt: string | null;
  status: IngestionRunStatus;
  itemsFetched: number;
  itemsCreated: number;
  itemsUpdated: number;
  itemsUnchanged: number;
  itemsFailed: number;
  errorSummary: string | null;
}

export type ExternalContentType =
  | 'DESTINATION'
  | 'NEWS'
  | 'EVENT'
  | 'TRAVEL_INFO';

export type ExternalProcessingStatus =
  | 'FETCHED'
  | 'NORMALIZED'
  | 'APPLIED'
  | 'REJECTED'
  | 'ERROR';

export interface ExternalItemRecord {
  id: number;
  sourceId: number;
  lastIngestionRunId: number;
  externalKey: string | null;
  sourceUrl: string;
  contentType: ExternalContentType;
  rawPayload: Record<string, unknown>;
  normalizedPayload: Record<string, unknown> | null;
  contentHash: string;
  sourcePublishedAt: string | null;
  firstSeenAt: string;
  fetchedAt: string;
  lastSeenAt: string;
  processingStatus: ExternalProcessingStatus;
}

export interface ExternalItemApplyRecord {
  id: number;
  sourceId: number;
  externalKey: string | null;
  sourceUrl: string;
  contentType: ExternalContentType;
  normalizedPayload: Record<string, unknown> | null;
  processingStatus: ExternalProcessingStatus;
}

export interface CreateExternalItemData {
  sourceId: number;
  lastIngestionRunId: number;
  externalKey: string | null;
  sourceUrl: string;
  contentType: ExternalContentType;
  rawPayload: Record<string, unknown>;
  contentHash: string;
  sourcePublishedAt?: string | null;
}

export interface UpdateExternalItemData {
  lastIngestionRunId: number;
  rawPayload: Record<string, unknown>;
  contentHash: string;
  sourcePublishedAt?: string | null;
  processingStatus: ExternalProcessingStatus;
}

@Injectable()
export class IngestionRepository {
  constructor(
    private readonly databaseService: DatabaseService,
  ) {}

  async findActiveSourceByCode(
    code: string,
  ): Promise<ExternalSourceRecord | null> {
    const result =
      await this.databaseService.query<ExternalSourceRecord>(
        `
        SELECT
          id,
          code,
          name,
          source_type AS "sourceType",
          base_url AS "baseUrl",
          is_active AS "isActive",
          crawl_interval_minutes AS "crawlIntervalMinutes",
          max_staleness_minutes AS "maxStalenessMinutes"
        FROM public.external_sources
        WHERE code = $1
          AND is_active = TRUE
        LIMIT 1
        `,
        [code],
      );

    return result.rows[0] ?? null;
  }

  async createIngestionRun(
    sourceId: number,
  ): Promise<IngestionRunRecord> {
    const result =
      await this.databaseService.query<IngestionRunRecord>(
        `
        INSERT INTO public.ingestion_runs (
          source_id
        )
        VALUES ($1)
        RETURNING
          id,
          source_id AS "sourceId",
          started_at AS "startedAt",
          finished_at AS "finishedAt",
          status,
          items_fetched AS "itemsFetched",
          items_created AS "itemsCreated",
          items_updated AS "itemsUpdated",
          items_unchanged AS "itemsUnchanged",
          items_failed AS "itemsFailed",
          error_summary AS "errorSummary"
        `,
        [sourceId],
      );

    const run = result.rows[0];

    if (!run) {
      throw new Error(
        'Failed to create ingestion run.',
      );
    }

    return run;
  }

  async finishIngestionRun(
    runId: number,
    status: Exclude<IngestionRunStatus, 'RUNNING'>,
    counts: {
      itemsFetched: number;
      itemsCreated: number;
      itemsUpdated: number;
      itemsUnchanged: number;
      itemsFailed: number;
    },
    errorSummary: string | null = null,
  ): Promise<IngestionRunRecord> {
    const result =
      await this.databaseService.query<IngestionRunRecord>(
        `
        UPDATE public.ingestion_runs
        SET
          finished_at = NOW(),
          status = $2,
          items_fetched = $3,
          items_created = $4,
          items_updated = $5,
          items_unchanged = $6,
          items_failed = $7,
          error_summary = $8
        WHERE id = $1
        RETURNING
          id,
          source_id AS "sourceId",
          started_at AS "startedAt",
          finished_at AS "finishedAt",
          status,
          items_fetched AS "itemsFetched",
          items_created AS "itemsCreated",
          items_updated AS "itemsUpdated",
          items_unchanged AS "itemsUnchanged",
          items_failed AS "itemsFailed",
          error_summary AS "errorSummary"
        `,
        [
          runId,
          status,
          counts.itemsFetched,
          counts.itemsCreated,
          counts.itemsUpdated,
          counts.itemsUnchanged,
          counts.itemsFailed,
          errorSummary,
        ],
      );

    const run = result.rows[0];

    if (!run) {
      throw new Error(
        `Ingestion run ${runId} was not found.`,
      );
    }

    return run;
  }

  async findExternalItemBySourceUrl(
    sourceId: number,
    sourceUrl: string,
  ): Promise<ExternalItemRecord | null> {
    const result =
      await this.databaseService.query<ExternalItemRecord>(
        `
        SELECT
          id,
          source_id AS "sourceId",
          last_ingestion_run_id AS "lastIngestionRunId",
          external_key AS "externalKey",
          source_url AS "sourceUrl",
          content_type AS "contentType",
          raw_payload AS "rawPayload",
          normalized_payload AS "normalizedPayload",
          content_hash AS "contentHash",
          source_published_at AS "sourcePublishedAt",
          first_seen_at AS "firstSeenAt",
          fetched_at AS "fetchedAt",
          last_seen_at AS "lastSeenAt",
          processing_status AS "processingStatus"
        FROM public.external_items
        WHERE source_id = $1
          AND source_url = $2
        LIMIT 1
        `,
        [sourceId, sourceUrl],
      );

    return result.rows[0] ?? null;
  }

  async findExternalItemByExternalKey(
    sourceId: number,
    externalKey: string,
  ): Promise<ExternalItemRecord | null> {
    const result =
      await this.databaseService.query<ExternalItemRecord>(
        `
        SELECT
          id,
          source_id AS "sourceId",
          last_ingestion_run_id AS "lastIngestionRunId",
          external_key AS "externalKey",
          source_url AS "sourceUrl",
          content_type AS "contentType",
          raw_payload AS "rawPayload",
          normalized_payload AS "normalizedPayload",
          content_hash AS "contentHash",
          source_published_at AS "sourcePublishedAt",
          first_seen_at AS "firstSeenAt",
          fetched_at AS "fetchedAt",
          last_seen_at AS "lastSeenAt",
          processing_status AS "processingStatus"
        FROM public.external_items
        WHERE source_id = $1
          AND external_key = $2
        LIMIT 1
        `,
        [sourceId, externalKey],
      );

    return result.rows[0] ?? null;
  }

  async findExternalItemForApply(
    itemId: number,
  ): Promise<ExternalItemApplyRecord | null> {
    const result =
      await this.databaseService.query<ExternalItemApplyRecord>(
        `
        SELECT
          id,
          source_id AS "sourceId",
          external_key AS "externalKey",
          source_url AS "sourceUrl",
          content_type AS "contentType",
          normalized_payload AS "normalizedPayload",
          processing_status AS "processingStatus"
        FROM public.external_items
        WHERE id = $1
        LIMIT 1
        `,
        [itemId],
      );

    return result.rows[0] ?? null;
  }

  async markExternalItemApplied(
    itemId: number,
  ): Promise<void> {
    await this.databaseService.query(
      `
      UPDATE public.external_items
      SET processing_status = 'APPLIED'
      WHERE id = $1
      `,
      [itemId],
    );
  }

  async findNormalizedDestinationItemsBySourceId(
    sourceId: number,
  ): Promise<ExternalItemApplyRecord[]> {
    const result =
      await this.databaseService.query<ExternalItemApplyRecord>(
        `
        SELECT
          id,
          source_id AS "sourceId",
          external_key AS "externalKey",
          source_url AS "sourceUrl",
          content_type AS "contentType",
          processing_status AS "processingStatus",
          normalized_payload AS "normalizedPayload"
        FROM public.external_items
        WHERE source_id = $1
          AND content_type = 'DESTINATION'
          AND processing_status = 'NORMALIZED'
          AND normalized_payload IS NOT NULL
        ORDER BY id ASC
        `,
        [sourceId],
      );

    return result.rows;
  }

  async createExternalItem(
    data: CreateExternalItemData,
  ): Promise<ExternalItemRecord> {
    const result =
      await this.databaseService.query<ExternalItemRecord>(
        `
        INSERT INTO public.external_items (
          source_id,
          last_ingestion_run_id,
          external_key,
          source_url,
          content_type,
          raw_payload,
          content_hash,
          source_published_at
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6::jsonb,
          $7,
          $8
        )
        RETURNING
          id,
          source_id AS "sourceId",
          last_ingestion_run_id AS "lastIngestionRunId",
          external_key AS "externalKey",
          source_url AS "sourceUrl",
          content_type AS "contentType",
          raw_payload AS "rawPayload",
          normalized_payload AS "normalizedPayload",
          content_hash AS "contentHash",
          source_published_at AS "sourcePublishedAt",
          first_seen_at AS "firstSeenAt",
          fetched_at AS "fetchedAt",
          last_seen_at AS "lastSeenAt",
          processing_status AS "processingStatus"
        `,
        [
          data.sourceId,
          data.lastIngestionRunId,
          data.externalKey,
          data.sourceUrl,
          data.contentType,
          JSON.stringify(data.rawPayload),
          data.contentHash,
          data.sourcePublishedAt ?? null,
        ],
      );

    const item = result.rows[0];

    if (!item) {
      throw new Error(
        'Failed to create external item.',
      );
    }

    return item;
  }

  async updateExternalItem(
    itemId: number,
    data: UpdateExternalItemData,
  ): Promise<ExternalItemRecord> {
    const result =
      await this.databaseService.query<ExternalItemRecord>(
        `
        UPDATE public.external_items
        SET
          last_ingestion_run_id = $2,
          raw_payload = $3::jsonb,
          content_hash = $4,
          source_published_at = $5,
          fetched_at = NOW(),
          last_seen_at = NOW(),
          processing_status = $6
        WHERE id = $1
        RETURNING
          id,
          source_id AS "sourceId",
          last_ingestion_run_id AS "lastIngestionRunId",
          external_key AS "externalKey",
          source_url AS "sourceUrl",
          content_type AS "contentType",
          raw_payload AS "rawPayload",
          normalized_payload AS "normalizedPayload",
          content_hash AS "contentHash",
          source_published_at AS "sourcePublishedAt",
          first_seen_at AS "firstSeenAt",
          fetched_at AS "fetchedAt",
          last_seen_at AS "lastSeenAt",
          processing_status AS "processingStatus"
        `,
        [
          itemId,
          data.lastIngestionRunId,
          JSON.stringify(data.rawPayload),
          data.contentHash,
          data.sourcePublishedAt ?? null,
          data.processingStatus,
        ],
      );

    const item = result.rows[0];

    if (!item) {
      throw new Error(
        `External item ${itemId} was not found.`,
      );
    }

    return item;
  }

  async markExternalItemProcessingStatus(
    itemId: number,
    processingStatus: ExternalProcessingStatus,
  ): Promise<void> {
    await this.databaseService.query(
      `
      UPDATE public.external_items
      SET
        processing_status = $2
      WHERE id = $1
      `,
      [itemId, processingStatus],
    );
  }

  async updateNormalizedPayload(
    itemId: number,
    normalizedPayload: Record<string, unknown>,
    processingStatus: ExternalProcessingStatus = 'NORMALIZED',
  ): Promise<ExternalItemRecord> {
    const result =
      await this.databaseService.query<ExternalItemRecord>(
        `
        UPDATE public.external_items
        SET
          normalized_payload = $2::jsonb,
          processing_status = $3
        WHERE id = $1
        RETURNING
          id,
          source_id AS "sourceId",
          last_ingestion_run_id AS "lastIngestionRunId",
          external_key AS "externalKey",
          source_url AS "sourceUrl",
          content_type AS "contentType",
          raw_payload AS "rawPayload",
          normalized_payload AS "normalizedPayload",
          content_hash AS "contentHash",
          source_published_at AS "sourcePublishedAt",
          first_seen_at AS "firstSeenAt",
          fetched_at AS "fetchedAt",
          last_seen_at AS "lastSeenAt",
          processing_status AS "processingStatus"
        `,
        [
          itemId,
          JSON.stringify(normalizedPayload),
          processingStatus,
        ],
      );

    const item = result.rows[0];

    if (!item) {
      throw new Error(
        `External item ${itemId} was not found.`,
      );
    }

    return item;
  }

  async findIngestionRunsBySource(
    sourceId: number,
    limit = 10,
  ): Promise<IngestionRunRecord[]> {
    const safeLimit = Math.min(
      Math.max(Math.trunc(limit), 1),
      100,
    );

    const result =
      await this.databaseService.query<IngestionRunRecord>(
        `
        SELECT
          id,
          source_id AS "sourceId",
          started_at AS "startedAt",
          finished_at AS "finishedAt",
          status,
          items_fetched AS "itemsFetched",
          items_created AS "itemsCreated",
          items_updated AS "itemsUpdated",
          items_unchanged AS "itemsUnchanged",
          items_failed AS "itemsFailed",
          error_summary AS "errorSummary"
        FROM public.ingestion_runs
        WHERE source_id = $1
        ORDER BY started_at DESC
        LIMIT $2
        `,
        [sourceId, safeLimit],
      );

    return result.rows;
  }
}
