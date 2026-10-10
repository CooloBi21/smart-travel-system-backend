import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../../database/database.service';

export interface CategoryRecord {
  id: number;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

export interface CreateCategoryInput {
  code: string;
  name: string;
  description?: string | null;
}

export interface UpdateCategoryInput {
  code?: string;
  name?: string;
  description?: string | null;
}

@Injectable()
export class CategoriesRepository {
  constructor(
    private readonly databaseService: DatabaseService,
  ) {}

  async findAllActive(): Promise<CategoryRecord[]> {
    const result =
      await this.databaseService.query<CategoryRecord>(
        `
        SELECT
          id,
          code,
          name,
          description,
          is_active AS "isActive"
        FROM public.tour_categories
        WHERE is_active = TRUE
        ORDER BY name ASC, id ASC
        `,
      );

    return result.rows;
  }

  async findAll(): Promise<CategoryRecord[]> {
    const result =
      await this.databaseService.query<CategoryRecord>(
        `
        SELECT
          id,
          code,
          name,
          description,
          is_active AS "isActive"
        FROM public.tour_categories
        ORDER BY
          CASE
            WHEN is_active = TRUE THEN 1
            ELSE 2
          END,
          name ASC,
          id ASC
        `,
      );

    return result.rows;
  }

  async findById(
    id: number,
  ): Promise<CategoryRecord | null> {
    const result =
      await this.databaseService.query<CategoryRecord>(
        `
        SELECT
          id,
          code,
          name,
          description,
          is_active AS "isActive"
        FROM public.tour_categories
        WHERE id = $1
        LIMIT 1
        `,
        [id],
      );

    return result.rows[0] ?? null;
  }

  async findByCode(
    code: string,
  ): Promise<CategoryRecord | null> {
    const result =
      await this.databaseService.query<CategoryRecord>(
        `
        SELECT
          id,
          code,
          name,
          description,
          is_active AS "isActive"
        FROM public.tour_categories
        WHERE LOWER(code) = LOWER($1)
        LIMIT 1
        `,
        [code],
      );

    return result.rows[0] ?? null;
  }

  async create(
    input: CreateCategoryInput,
  ): Promise<CategoryRecord> {
    const result =
      await this.databaseService.query<CategoryRecord>(
        `
        INSERT INTO public.tour_categories (
          code,
          name,
          description,
          is_active
        )
        VALUES ($1, $2, $3, TRUE)
        RETURNING
          id,
          code,
          name,
          description,
          is_active AS "isActive"
        `,
        [
          input.code,
          input.name,
          input.description ?? null,
        ],
      );

    return result.rows[0];
  }

  async update(
    id: number,
    input: UpdateCategoryInput,
  ): Promise<CategoryRecord | null> {
    const result =
      await this.databaseService.query<CategoryRecord>(
        `
        UPDATE public.tour_categories
        SET
          code = COALESCE($2, code),
          name = COALESCE($3, name),
          description = CASE
            WHEN $4::text IS NULL THEN description
            ELSE $4
          END
        WHERE id = $1
        RETURNING
          id,
          code,
          name,
          description,
          is_active AS "isActive"
        `,
        [
          id,
          input.code ?? null,
          input.name ?? null,
          input.description ?? null,
        ],
      );

    return result.rows[0] ?? null;
  }

  async updateActiveStatus(
    id: number,
    isActive: boolean,
  ): Promise<CategoryRecord | null> {
    const result =
      await this.databaseService.query<CategoryRecord>(
        `
        UPDATE public.tour_categories
        SET
          is_active = $2
        WHERE id = $1
        RETURNING
          id,
          code,
          name,
          description,
          is_active AS "isActive"
        `,
        [id, isActive],
      );

    return result.rows[0] ?? null;
  }
}
