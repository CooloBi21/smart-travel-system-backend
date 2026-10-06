import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from '../../database/database.service';

export interface UserPreferenceRecord {
  userId: number;
  preferredCategoryId: number | null;
  preferredDestinationId: number | null;
  budgetMin: number;
  budgetMax: number | null;
  preferredDurationDays: number | null;
  travelStyle: string | null;
  travelWith: string | null;
}

export interface CompletedTourHistoryRecord {
  bookingId: number;
  tourId: number;
  destinationId: number;
  categoryId: number;
  durationDays: number;
  travelStyle: string;
  completedAt: string;
}

export interface FavoriteRecord {
  tourId: number;
  createdAt: string;
}

export interface BehaviorSignalRecord {
  tourId: number | null;
  actionType: string;
  durationSeconds: number | null;
  createdAt: string;
}

export interface CandidateTourRecord {
  tourId: number;
  companyId: number;
  companyName: string;
  companySlug: string;

  destinationId: number;
  destinationName: string;

  categoryId: number;
  categoryCode: string;

  title: string;
  slug: string;
  description: string | null;

  durationDays: number;
  travelStyle: string;
  status: string;

  minPrice: number | null;
}

export interface CreateRecommendationRunData {
  userId: number;
  algorithmCode: string;
  algorithmVersion: string;
  context: Record<string, unknown>;
}

export interface CreateRecommendationItemData {
  tourId: number;
  rankPosition: number;
  score: number;
  reason: string;
}

@Injectable()
export class RecommendationRepository {
  constructor(
    private readonly databaseService: DatabaseService,
  ) {}

  async getUserPreferences(
    userId: number,
  ): Promise<UserPreferenceRecord | null> {
    const result =
      await this.databaseService.query<UserPreferenceRecord>(
        `
        SELECT
            user_id AS "userId",
            preferred_category_id AS "preferredCategoryId",
            preferred_destination_id AS "preferredDestinationId",
            budget_min AS "budgetMin",
            budget_max AS "budgetMax",
            preferred_duration_days AS "preferredDurationDays",
            travel_style AS "travelStyle",
            travel_with AS "travelWith"
        FROM public.user_preferences
        WHERE user_id = $1
        LIMIT 1
        `,
        [userId],
      );

    return result.rows[0] ?? null;
  }

  async getCompletedTourHistory(
    userId: number,
  ): Promise<CompletedTourHistoryRecord[]> {
    const result =
      await this.databaseService.query<CompletedTourHistoryRecord>(
        `
        SELECT
            b.id AS "bookingId",
            t.id AS "tourId",
            t.destination_id AS "destinationId",
            t.category_id AS "categoryId",
            t.duration_days AS "durationDays",
            t.travel_style AS "travelStyle",
            b.completed_at AS "completedAt"
        FROM public.bookings b

        INNER JOIN public.tour_departures td
            ON td.id = b.tour_departure_id

        INNER JOIN public.tours t
            ON t.id = td.tour_id

        WHERE b.user_id = $1
          AND b.status = 'COMPLETED'

        ORDER BY
            b.completed_at DESC,
            b.id DESC
        `,
        [userId],
      );

    return result.rows;
  }

  async getFavoriteTours(
    userId: number,
  ): Promise<FavoriteRecord[]> {
    const result =
      await this.databaseService.query<FavoriteRecord>(
        `
        SELECT
            tour_id AS "tourId",
            created_at AS "createdAt"
        FROM public.favorites
        WHERE user_id = $1
        ORDER BY created_at DESC
        `,
        [userId],
      );

    return result.rows;
  }

  async getBehaviorSignals(
    userId: number,
  ): Promise<BehaviorSignalRecord[]> {
    const result =
      await this.databaseService.query<BehaviorSignalRecord>(
        `
        SELECT
            tour_id AS "tourId",
            action_type AS "actionType",
            duration_seconds AS "durationSeconds",
            created_at AS "createdAt"
        FROM public.behavior_logs
        WHERE user_id = $1
        ORDER BY created_at DESC
        `,
        [userId],
      );

    return result.rows;
  }

  async getCandidateTours(): Promise<CandidateTourRecord[]> {
    const result =
      await this.databaseService.query<CandidateTourRecord>(
        `
        SELECT
            t.id AS "tourId",
            t.company_id AS "companyId",

            c.name AS "companyName",
            c.slug AS "companySlug",

            t.destination_id AS "destinationId",
            d.name AS "destinationName",

            t.category_id AS "categoryId",
            tc.code AS "categoryCode",

            t.title,
            t.slug,
            t.description,

            t.duration_days AS "durationDays",
            t.travel_style AS "travelStyle",
            t.status,

            MIN(td.price_per_person) AS "minPrice"

        FROM public.tours t

        INNER JOIN public.companies c
            ON c.id = t.company_id

        INNER JOIN public.destinations d
            ON d.id = t.destination_id

        INNER JOIN public.tour_categories tc
            ON tc.id = t.category_id

        INNER JOIN public.tour_departures td
            ON td.tour_id = t.id

        WHERE c.status = 'ACTIVE'
          AND t.status = 'PUBLISHED'
          AND td.status = 'SCHEDULED'

        GROUP BY
            t.id,
            t.company_id,
            c.name,
            c.slug,
            t.destination_id,
            d.name,
            t.category_id,
            tc.code,
            t.title,
            t.slug,
            t.description,
            t.duration_days,
            t.travel_style,
            t.status

        ORDER BY t.id ASC
        `,
      );

    return result.rows;
  }

  async createRecommendationRunWithItems(
    run: CreateRecommendationRunData,
    items: CreateRecommendationItemData[],
  ): Promise<number> {
    return this.databaseService.withTransaction(
      async (client: PoolClient) => {
        const runResult = await client.query<{ id: number }>(
          `
          INSERT INTO public.recommendation_runs (
            user_id,
            algorithm_code,
            algorithm_version,
            context
          )
          VALUES ($1, $2, $3, $4::jsonb)
          RETURNING id
          `,
          [
            run.userId,
            run.algorithmCode,
            run.algorithmVersion,
            JSON.stringify(run.context),
          ],
        );

        const runRow = runResult.rows[0];

        if (!runRow) {
          throw new Error(
            'Failed to create recommendation run.',
          );
        }

        for (const item of items) {
          await client.query(
            `
            INSERT INTO public.recommendation_items (
              recommendation_run_id,
              tour_id,
              rank_position,
              score,
              reason
            )
            VALUES ($1, $2, $3, $4, $5)
            `,
            [
              runRow.id,
              item.tourId,
              item.rankPosition,
              item.score,
              item.reason,
            ],
          );
        }

        return runRow.id;
      },
    );
  }
}
