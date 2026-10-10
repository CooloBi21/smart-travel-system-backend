import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'COMPLETED';

export interface BookingRecord {
  id: number;
  userId: number;
  tourDepartureId: number;
  guestCount: number;
  unitPrice: number;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  specialRequest: string | null;
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyBookingRecord extends BookingRecord {
  tourId: number;
  tourTitle: string;
  departureDate: string;
  departurePrice: number;
  departureCapacity: number;
  departureStatus:
    | 'SCHEDULED'
    | 'CLOSED'
    | 'CANCELLED'
    | 'COMPLETED';
}

export interface CreateBookingData {
  userId: number;
  tourDepartureId: number;
  guestCount: number;
  unitPrice: number;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  specialRequest?: string | null;
}

@Injectable()
export class BookingsRepository {
  constructor(
    private readonly databaseService: DatabaseService,
  ) {}

  async findById(
    id: number,
  ): Promise<BookingRecord | null> {
    const result =
      await this.databaseService.query<BookingRecord>(
        `
          SELECT
            id,
            user_id AS "userId",
            tour_departure_id AS "tourDepartureId",
            guest_count AS "guestCount",
            unit_price AS "unitPrice",
            contact_name AS "contactName",
            contact_email AS "contactEmail",
            contact_phone AS "contactPhone",
            special_request AS "specialRequest",
            status,
            created_at AS "createdAt",
            updated_at AS "updatedAt"
          FROM public.bookings
          WHERE id = $1
        `,
        [id],
      );

    return result.rows[0] ?? null;
  }

  async findByUserId(
    userId: number,
  ): Promise<BookingRecord[]> {
    const result =
      await this.databaseService.query<BookingRecord>(
        `
          SELECT
            id,
            user_id AS "userId",
            tour_departure_id AS "tourDepartureId",
            guest_count AS "guestCount",
            unit_price AS "unitPrice",
            contact_name AS "contactName",
            contact_email AS "contactEmail",
            contact_phone AS "contactPhone",
            special_request AS "specialRequest",
            status,
            created_at AS "createdAt",
            updated_at AS "updatedAt"
          FROM public.bookings
          WHERE user_id = $1
          ORDER BY created_at DESC
        `,
        [userId],
      );

    return result.rows;
  }

  async findByCompanyId(
    companyId: number,
  ): Promise<CompanyBookingRecord[]> {
    const result =
      await this.databaseService.query<CompanyBookingRecord>(
        `
          SELECT
            b.id,
            b.user_id AS "userId",
            b.tour_departure_id AS "tourDepartureId",
            t.id AS "tourId",
            t.title AS "tourTitle",
            td.departure_date AS "departureDate",
            td.price_per_person AS "departurePrice",
            td.capacity AS "departureCapacity",
            td.status AS "departureStatus",
            b.guest_count AS "guestCount",
            b.unit_price AS "unitPrice",
            b.contact_name AS "contactName",
            b.contact_email AS "contactEmail",
            b.contact_phone AS "contactPhone",
            b.special_request AS "specialRequest",
            b.status,
            b.created_at AS "createdAt",
            b.updated_at AS "updatedAt"
          FROM public.bookings b
          INNER JOIN public.tour_departures td
            ON td.id = b.tour_departure_id
          INNER JOIN public.tours t
            ON t.id = td.tour_id
          WHERE t.company_id = $1
          ORDER BY b.created_at DESC
        `,
        [companyId],
      );

    return result.rows;
  }

  async findByIdAndCompanyId(
    id: number,
    companyId: number,
  ): Promise<CompanyBookingRecord | null> {
    const result =
      await this.databaseService.query<CompanyBookingRecord>(
        `
          SELECT
            b.id,
            b.user_id AS "userId",
            b.tour_departure_id AS "tourDepartureId",
            t.id AS "tourId",
            t.title AS "tourTitle",
            td.departure_date AS "departureDate",
            td.price_per_person AS "departurePrice",
            td.capacity AS "departureCapacity",
            td.status AS "departureStatus",
            b.guest_count AS "guestCount",
            b.unit_price AS "unitPrice",
            b.contact_name AS "contactName",
            b.contact_email AS "contactEmail",
            b.contact_phone AS "contactPhone",
            b.special_request AS "specialRequest",
            b.status,
            b.created_at AS "createdAt",
            b.updated_at AS "updatedAt"
          FROM public.bookings b
          INNER JOIN public.tour_departures td
            ON td.id = b.tour_departure_id
          INNER JOIN public.tours t
            ON t.id = td.tour_id
          WHERE b.id = $1
            AND t.company_id = $2
          LIMIT 1
        `,
        [id, companyId],
      );

    return result.rows[0] ?? null;
  }

  async updateStatusByCompany(
    bookingId: number,
    companyId: number,
    status: BookingStatus,
    expectedStatus: BookingStatus,
  ): Promise<BookingRecord | null> {
    const result =
      await this.databaseService.query<BookingRecord>(
        `
          UPDATE public.bookings b
          SET
            status = $3,
            confirmed_at = CASE
              WHEN $3 = 'CONFIRMED' THEN COALESCE(b.confirmed_at, NOW())
              ELSE b.confirmed_at
            END,
            cancelled_at = CASE
              WHEN $3 = 'CANCELLED' THEN COALESCE(b.cancelled_at, NOW())
              ELSE b.cancelled_at
            END,
            completed_at = CASE
              WHEN $3 = 'COMPLETED' THEN COALESCE(b.completed_at, NOW())
              ELSE b.completed_at
            END,
            updated_at = NOW()
          FROM public.tour_departures td
          INNER JOIN public.tours t
            ON t.id = td.tour_id
          WHERE b.id = $1
            AND b.tour_departure_id = td.id
            AND t.company_id = $2
            AND b.status = $4
            AND (
              $3 <> 'COMPLETED'
              OR td.departure_date + t.duration_days - 1 < CURRENT_DATE
            )
          RETURNING
            b.id,
            b.user_id AS "userId",
            b.tour_departure_id AS "tourDepartureId",
            b.guest_count AS "guestCount",
            b.unit_price AS "unitPrice",
            b.contact_name AS "contactName",
            b.contact_email AS "contactEmail",
            b.contact_phone AS "contactPhone",
            b.special_request AS "specialRequest",
            b.status,
            b.created_at AS "createdAt",
            b.updated_at AS "updatedAt"
        `,
        [bookingId, companyId, status, expectedStatus],
      );

    return result.rows[0] ?? null;
  }

  async create(
    data: CreateBookingData,
  ): Promise<BookingRecord> {
    const result =
      await this.databaseService.query<BookingRecord>(
        `
          INSERT INTO public.bookings (
            user_id,
            tour_departure_id,
            guest_count,
            unit_price,
            contact_name,
            contact_email,
            contact_phone,
            special_request
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING
            id,
            user_id AS "userId",
            tour_departure_id AS "tourDepartureId",
            guest_count AS "guestCount",
            unit_price AS "unitPrice",
            contact_name AS "contactName",
            contact_email AS "contactEmail",
            contact_phone AS "contactPhone",
            special_request AS "specialRequest",
            status,
            created_at AS "createdAt",
            updated_at AS "updatedAt"
        `,
        [
          data.userId,
          data.tourDepartureId,
          data.guestCount,
          data.unitPrice,
          data.contactName,
          data.contactEmail,
          data.contactPhone,
          data.specialRequest ?? null,
        ],
      );

    const booking = result.rows[0];

    if (!booking) {
      throw new Error(
        'Booking creation returned no data.',
      );
    }

    return booking;
  }

  async updateStatus(
    id: number,
    status: BookingStatus,
  ): Promise<BookingRecord | null> {
    const result =
      await this.databaseService.query<BookingRecord>(
        `
          UPDATE public.bookings
          SET
            status = $2,
            updated_at = NOW()
          WHERE id = $1
          RETURNING
            id,
            user_id AS "userId",
            tour_departure_id AS "tourDepartureId",
            guest_count AS "guestCount",
            unit_price AS "unitPrice",
            contact_name AS "contactName",
            contact_email AS "contactEmail",
            contact_phone AS "contactPhone",
            special_request AS "specialRequest",
            status,
            created_at AS "createdAt",
            updated_at AS "updatedAt"
        `,
        [id, status],
      );

    return result.rows[0] ?? null;
  }
}
