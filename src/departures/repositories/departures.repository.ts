import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export type DepartureStatus =
  | 'SCHEDULED'
  | 'CLOSED'
  | 'CANCELLED'
  | 'COMPLETED';

export interface DepartureRecord {
  id: number;
  tourId: number;
  departureDate: string;
  pricePerPerson: number;
  capacity: number;
  status: DepartureStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartureInput {
  tourId: number;
  departureDate: string;
  pricePerPerson: number;
  capacity: number;
}

export interface UpdateDepartureInput {
  departureDate?: string;
  pricePerPerson?: number;
  capacity?: number;
}

@Injectable()
export class DeparturesRepository {
  constructor(
    private readonly databaseService: DatabaseService,
  ) {}

  async findAllByTourId(
    tourId: number,
  ): Promise<DepartureRecord[]> {
    const result =
      await this.databaseService.query<DepartureRow>(
        `
          SELECT
            id,
            tour_id,
            departure_date,
            price_per_person,
            capacity,
            status,
            created_at,
            updated_at
          FROM public.tour_departures
          WHERE tour_id = $1
          ORDER BY departure_date ASC, id ASC
        `,
        [tourId],
      );

    return result.rows.map((row) => this.mapDeparture(row));
  }

  async findByIdAndTourId(
    departureId: number,
    tourId: number,
  ): Promise<DepartureRecord | null> {
    const result =
      await this.databaseService.query<DepartureRow>(
        `
          SELECT
            id,
            tour_id,
            departure_date,
            price_per_person,
            capacity,
            status,
            created_at,
            updated_at
          FROM public.tour_departures
          WHERE id = $1
            AND tour_id = $2
          LIMIT 1
        `,
        [departureId, tourId],
      );

    const row = result.rows[0];

    return row ? this.mapDeparture(row) : null;
  }

  async findByTourAndDate(
    tourId: number,
    departureDate: string,
  ): Promise<DepartureRecord | null> {
    const result =
      await this.databaseService.query<DepartureRow>(
        `
          SELECT
            id,
            tour_id,
            departure_date,
            price_per_person,
            capacity,
            status,
            created_at,
            updated_at
          FROM public.tour_departures
          WHERE tour_id = $1
            AND departure_date = $2
          LIMIT 1
        `,
        [tourId, departureDate],
      );

    const row = result.rows[0];

    return row ? this.mapDeparture(row) : null;
  }

  async create(
    input: CreateDepartureInput,
  ): Promise<DepartureRecord> {
    const result =
      await this.databaseService.query<DepartureRow>(
        `
          INSERT INTO public.tour_departures (
            tour_id,
            departure_date,
            price_per_person,
            capacity
          )
          VALUES ($1, $2, $3, $4)
          RETURNING
            id,
            tour_id,
            departure_date,
            price_per_person,
            capacity,
            status,
            created_at,
            updated_at
        `,
        [
          input.tourId,
          input.departureDate,
          input.pricePerPerson,
          input.capacity,
        ],
      );

    const row = result.rows[0];

    if (!row) {
      throw new Error(
        'Departure creation returned no data.',
      );
    }

    return this.mapDeparture(row);
  }

  async update(
    departureId: number,
    tourId: number,
    input: UpdateDepartureInput,
  ): Promise<DepartureRecord | null> {
    const fields: string[] = [];
    const params: unknown[] = [];

    if (input.departureDate !== undefined) {
      fields.push(`departure_date = $${params.length + 1}`);
      params.push(input.departureDate);
    }

    if (input.pricePerPerson !== undefined) {
      fields.push(
        `price_per_person = $${params.length + 1}`,
      );
      params.push(input.pricePerPerson);
    }

    if (input.capacity !== undefined) {
      fields.push(`capacity = $${params.length + 1}`);
      params.push(input.capacity);
    }

    if (fields.length === 0) {
      return this.findByIdAndTourId(
        departureId,
        tourId,
      );
    }

    params.push(departureId);
    params.push(tourId);

    const departureIdParam = params.length - 1;
    const tourIdParam = params.length;

    const result =
      await this.databaseService.query<DepartureRow>(
        `
          UPDATE public.tour_departures
          SET
            ${fields.join(', ')}
          WHERE id = $${departureIdParam}
            AND tour_id = $${tourIdParam}
          RETURNING
            id,
            tour_id,
            departure_date,
            price_per_person,
            capacity,
            status,
            created_at,
            updated_at
        `,
        params,
      );

    const row = result.rows[0];

    return row ? this.mapDeparture(row) : null;
  }

  async updateStatus(
    departureId: number,
    tourId: number,
    status: DepartureStatus,
  ): Promise<DepartureRecord | null> {
    const result =
      await this.databaseService.query<DepartureRow>(
        `
          UPDATE public.tour_departures
          SET
            status = $1
          WHERE id = $2
            AND tour_id = $3
          RETURNING
            id,
            tour_id,
            departure_date,
            price_per_person,
            capacity,
            status,
            created_at,
            updated_at
        `,
        [status, departureId, tourId],
      );

    const row = result.rows[0];

    return row ? this.mapDeparture(row) : null;
  }

  async delete(
    departureId: number,
    tourId: number,
  ): Promise<boolean> {
    const result =
      await this.databaseService.query(
        `
          DELETE FROM public.tour_departures
          WHERE id = $1
            AND tour_id = $2
        `,
        [departureId, tourId],
      );

    return result.rowCount === 1;
  }

  private mapDeparture(
    row: DepartureRow,
  ): DepartureRecord {
    return {
      id: row.id,
      tourId: row.tour_id,
      departureDate: row.departure_date,
      pricePerPerson: Number(row.price_per_person),
      capacity: row.capacity,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

interface DepartureRow {
  id: number;
  tour_id: number;
  departure_date: string;
  price_per_person: string | number;
  capacity: number;
  status: DepartureStatus;
  created_at: string;
  updated_at: string;
}
