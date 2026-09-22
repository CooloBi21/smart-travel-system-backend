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

export interface PublicTourRecord extends TourRecord {
  companyName: string;
  companySlug: string;
  destinationName: string;
  categoryCode: string;
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

export interface UpdateTourInput {
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

  async findAllByCompanyId(
    companyId: number,
  ): Promise<TourRecord[]> {
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
        ORDER BY created_at DESC, id DESC
      `,
      [companyId],
    );

    return result.rows.map((tour) =>
      this.mapTour(tour),
    );
  }

  async findByIdAndCompanyId(
    id: number,
    companyId: number,
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
        WHERE id = $1
          AND company_id = $2
        LIMIT 1
      `,
      [
        id,
        companyId,
      ],
    );

    const tour = result.rows[0];

    if (!tour) {
      return null;
    }

    return this.mapTour(tour);
  }

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

  async updateByIdAndCompanyId(
    id: number,
    companyId: number,
    input: UpdateTourInput,
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
        UPDATE public.tours
        SET
          destination_id = $3,
          category_id = $4,
          title = $5,
          slug = $6,
          description = $7,
          duration_days = $8,
          travel_style = $9,
          cancellation_policy = $10,
          updated_at = now()
        WHERE id = $1
          AND company_id = $2
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
        id,
        companyId,
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
      return null;
    }

    return this.mapTour(tour);
  }

  async updateStatusByIdAndCompanyId(
    id: number,
    companyId: number,
    status: TourStatus,
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
        UPDATE public.tours
        SET
          status = $3::varchar,
          published_at = CASE
            WHEN $3::varchar = 'PUBLISHED'::varchar
              THEN COALESCE(published_at, now())
            ELSE published_at
          END,
          updated_at = now()
        WHERE id = $1
          AND company_id = $2
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
        id,
        companyId,
        status,
      ],
    );

    const tour = result.rows[0];

    if (!tour) {
      return null;
    }

    return this.mapTour(tour);
  }

  async findAllPublished(): Promise<PublicTourRecord[]> {
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
      company_name: string;
      company_slug: string;
      destination_name: string;
      category_code: string;
    }>(
      `
        SELECT
          t.id,
          t.company_id,
          t.destination_id,
          t.category_id,
          t.title,
          t.slug,
          t.description,
          t.duration_days,
          t.travel_style,
          t.cancellation_policy,
          t.status,
          t.published_at,
          t.created_at,
          t.updated_at,
          c.name AS company_name,
          c.slug AS company_slug,
          d.name AS destination_name,
          tc.code AS category_code
        FROM public.tours t
        INNER JOIN public.companies c
          ON c.id = t.company_id
        INNER JOIN public.destinations d
          ON d.id = t.destination_id
        INNER JOIN public.tour_categories tc
          ON tc.id = t.category_id
        WHERE t.status = 'PUBLISHED'
          AND c.status = 'ACTIVE'
        ORDER BY t.published_at DESC, t.id DESC
      `,
    );

    return result.rows.map((row) => ({
      ...this.mapTour(row),
      companyName: row.company_name,
      companySlug: row.company_slug,
      destinationName: row.destination_name,
      categoryCode: row.category_code,
    }));
  }

  async findPublishedByCompanyAndSlug(
    companySlug: string,
    tourSlug: string,
  ): Promise<PublicTourRecord | null> {
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
      company_name: string;
      company_slug: string;
      destination_name: string;
      category_code: string;
    }>(
      `
        SELECT
          t.id,
          t.company_id,
          t.destination_id,
          t.category_id,
          t.title,
          t.slug,
          t.description,
          t.duration_days,
          t.travel_style,
          t.cancellation_policy,
          t.status,
          t.published_at,
          t.created_at,
          t.updated_at,
          c.name AS company_name,
          c.slug AS company_slug,
          d.name AS destination_name,
          tc.code AS category_code
        FROM public.tours t
        INNER JOIN public.companies c
          ON c.id = t.company_id
        INNER JOIN public.destinations d
          ON d.id = t.destination_id
        INNER JOIN public.tour_categories tc
          ON tc.id = t.category_id
        WHERE c.slug = $1
          AND t.slug = $2
          AND c.status = 'ACTIVE'
          AND t.status = 'PUBLISHED'
        LIMIT 1
      `,
      [
        companySlug,
        tourSlug,
      ],
    );

    const tour = result.rows[0];

    if (!tour) {
      return null;
    }

    return {
      ...this.mapTour(tour),
      companyName: tour.company_name,
      companySlug: tour.company_slug,
      destinationName: tour.destination_name,
      categoryCode: tour.category_code,
    };
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
