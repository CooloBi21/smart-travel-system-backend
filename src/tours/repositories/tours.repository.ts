import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export type TourStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'PAUSED'
  | 'ARCHIVED';

export type TourTravelStyle =
  | 'BEACH'
  | 'CULTURE'
  | 'EXPLORE'
  | 'RELAX'
  | 'ADVENTURE';

export interface TourRecord {
  id: number;
  companyId: number;
  destinationId: number;
  categoryId: number;
  title: string;
  slug: string;
  description: string | null;
  durationDays: number;
  travelStyle: TourTravelStyle;
  cancellationPolicy: string | null;
  status: TourStatus;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTourInput {
  companyId: number;
  destinationId: number;
  categoryId: number;
  title: string;
  slug: string;
  description: string | null;
  durationDays: number;
  travelStyle: TourTravelStyle;
  cancellationPolicy: string | null;
}

@Injectable()
export class ToursRepository {
  constructor(
    private readonly databaseService: DatabaseService,
  ) {}

  async findByCompanyAndSlug(
    companyId: number,
    slug: string,
  ): Promise<TourRecord | null> {
    const result = await this.databaseService.query<{
      id: number;
      company_id: number;
      destination_id: number;
      category_id: number;
      title: string;
      slug: string;
      description: string | null;
      duration_days: number;
      travel_style: TourTravelStyle;
      cancellation_policy: string | null;
      status: TourStatus;
      published_at: Date | null;
      created_at: Date;
      updated_at: Date;
    }>(
      `
        SELECT
          id,
          company_id,
          destination_id,
          category_id,
          title,
          slug,
          description,
          duration_days,
          travel_style,
          cancellation_policy,
          status,
          published_at,
          created_at,
          updated_at
        FROM public.tours
        WHERE company_id = $1
          AND slug = $2
        LIMIT 1
      `,
      [
        companyId,
        slug,
      ],
    );

    const tour = result.rows[0];

    if (!tour) {
      return null;
    }

    return this.mapTour(tour);
  }

  async isActiveDestination(
    destinationId: number,
  ): Promise<boolean> {
    const result = await this.databaseService.query<{
      exists: boolean;
    }>(
      `
        SELECT EXISTS (
          SELECT 1
          FROM public.destinations
          WHERE id = $1
            AND status = 'ACTIVE'
        ) AS exists
      `,
      [destinationId],
    );

    return result.rows[0]?.exists ?? false;
  }

  async isActiveCategory(
    categoryId: number,
  ): Promise<boolean> {
    const result = await this.databaseService.query<{
      exists: boolean;
    }>(
      `
        SELECT EXISTS (
          SELECT 1
          FROM public.tour_categories
          WHERE id = $1
            AND is_active = TRUE
        ) AS exists
      `,
      [categoryId],
    );

    return result.rows[0]?.exists ?? false;
  }

  async create(
    input: CreateTourInput,
  ): Promise<TourRecord> {
    const result = await this.databaseService.query<{
      id: number;
      company_id: number;
      destination_id: number;
      category_id: number;
      title: string;
      slug: string;
      description: string | null;
      duration_days: number;
      travel_style: TourTravelStyle;
      cancellation_policy: string | null;
      status: TourStatus;
      published_at: Date | null;
      created_at: Date;
      updated_at: Date;
    }>(
      `
        INSERT INTO public.tours (
          company_id,
          destination_id,
          category_id,
          title,
          slug,
          description,
          duration_days,
          travel_style,
          cancellation_policy,
          status
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          'DRAFT'
        )
        RETURNING
          id,
          company_id,
          destination_id,
          category_id,
          title,
          slug,
          description,
          duration_days,
          travel_style,
          cancellation_policy,
          status,
          published_at,
          created_at,
          updated_at
      `,
      [
        input.companyId,
        input.destinationId,
        input.categoryId,
        input.title,
        input.slug,
        input.description,
        input.durationDays,
        input.travelStyle,
        input.cancellationPolicy,
      ],
    );

    const tour = result.rows[0];

    if (!tour) {
      throw new Error(
        'Tour creation returned no data.',
      );
    }

    return this.mapTour(tour);
  }

  private mapTour(row: {
    id: number;
    company_id: number;
    destination_id: number;
    category_id: number;
    title: string;
    slug: string;
    description: string | null;
    duration_days: number;
    travel_style: TourTravelStyle;
    cancellation_policy: string | null;
    status: TourStatus;
    published_at: Date | null;
    created_at: Date;
    updated_at: Date;
  }): TourRecord {
    return {
      id: row.id,
      companyId: row.company_id,
      destinationId: row.destination_id,
      categoryId: row.category_id,
      title: row.title,
      slug: row.slug,
      description: row.description,
      durationDays: row.duration_days,
      travelStyle: row.travel_style,
      cancellationPolicy: row.cancellation_policy,
      status: row.status,
      publishedAt: row.published_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
