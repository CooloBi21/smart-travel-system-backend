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