import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from '../database/database.service';
import { RealtimeService } from '../realtime/realtime.service';
import {
  BookingRecord,
  BookingsRepository,
} from './repositories/bookings.repository';
import { CreateBookingDto } from './dto/create-booking.dto';

interface DepartureForBooking {
  id: number;
  tourId: number;
  departureDate: string;
  pricePerPerson: number;
  capacity: number;
  status:
    | 'SCHEDULED'
    | 'CLOSED'
    | 'CANCELLED'
    | 'COMPLETED';
}

export interface BookingResult {
  booking: BookingRecord;
  totalAmount: number;
}

export interface BookingView extends BookingRecord {
  totalAmount: number;
}

@Injectable()
export class BookingsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly bookingsRepository: BookingsRepository,
    private readonly realtimeService: RealtimeService,
  ) {}

  async createBooking(
    userId: number,
    dto: CreateBookingDto,
  ): Promise<BookingResult> {
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new BadRequestException(
        'Authenticated user is invalid.',
      );
    }

    const result =
      await this.databaseService.withTransaction(
        async (client: PoolClient) => {
          const departure =
            await this.findDepartureForBooking(
              client,
              dto.tourDepartureId,
            );

          if (!departure) {
            throw new NotFoundException(
              'Tour departure not found.',
            );
          }

          const reservedSlots =
            await this.getReservedSlots(
              client,
              departure.id,
            );

          const availableSlots =
            departure.capacity - reservedSlots;

          if (dto.guestCount > availableSlots) {
            throw new ConflictException(
              `Not enough available seats. Available: ${availableSlots}.`,
            );
          }

          const booking =
            await this.createBookingInTransaction(
              client,
              userId,
              dto,
              departure.pricePerPerson,
            );

          const totalAmount =
            booking.guestCount *
            booking.unitPrice;

          return {
            booking,
            totalAmount,
          };
        },
      );

    this.realtimeService.emitToUser(
      userId,
      'booking.created',
      {
        bookingId: result.booking.id,
        departureId:
          result.booking.tourDepartureId,
        guestCount: result.booking.guestCount,
        unitPrice: result.booking.unitPrice,
        status: result.booking.status,
        totalAmount: result.totalAmount,
      },
    );

    return result;
  }

  private toBookingView(booking: BookingRecord): BookingView {
    return {
      ...booking,
      totalAmount:
        Number(booking.unitPrice) *
        Number(booking.guestCount),
    };
  }

  async getMyBookings(
    userId: number,
  ): Promise<BookingView[]> {
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new BadRequestException(
        'Authenticated user is invalid.',
      );
    }

    const bookings =
      await this.bookingsRepository.findByUserId(userId);

    return bookings.map((booking) =>
      this.toBookingView(booking),
    );
  }

  async getMyBookingById(
    userId: number,
    bookingId: number,
  ): Promise<BookingView> {
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new BadRequestException(
        'Authenticated user is invalid.',
      );
    }

    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      throw new BadRequestException(
        'Invalid booking ID.',
      );
    }

    const booking =
      await this.bookingsRepository.findById(
        bookingId,
      );

    if (!booking) {
      throw new NotFoundException(
        'Booking not found.',
      );
    }

    if (booking.userId !== userId) {
      throw new NotFoundException(
        'Booking not found.',
      );
    }

    return this.toBookingView(booking);
  }

  private async findDepartureForBooking(
    client: PoolClient,
    departureId: number,
  ): Promise<DepartureForBooking | null> {
    const result =
      await client.query<DepartureRow>(
        `
          SELECT
            id,
            tour_id,
            departure_date,
            price_per_person,
            capacity,
            status
          FROM public.tour_departures
          WHERE id = $1
          FOR UPDATE
        `,
        [departureId],
      );

    const row = result.rows[0];

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      tourId: row.tour_id,
      departureDate: row.departure_date,
      pricePerPerson: Number(
        row.price_per_person,
      ),
      capacity: row.capacity,
      status: row.status,
    };
  }

  private async getReservedSlots(
    client: PoolClient,
    departureId: number,
  ): Promise<number> {
    const result =
      await client.query<ReservedSlotsRow>(
        `
          SELECT
            COALESCE(
              SUM(guest_count)
              FILTER (
                WHERE status IN (
                  'PENDING',
                  'CONFIRMED'
                )
              ),
              0
            )::INTEGER AS reserved_slots
          FROM public.bookings
          WHERE tour_departure_id = $1
        `,
        [departureId],
      );

    return result.rows[0]?.reserved_slots ?? 0;
  }

  private async createBookingInTransaction(
    client: PoolClient,
    userId: number,
    dto: CreateBookingDto,
    unitPrice: number,
  ): Promise<BookingRecord> {
    const result =
      await client.query<BookingRow>(
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
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8
          )
          RETURNING
            id,
            user_id,
            tour_departure_id,
            guest_count,
            unit_price,
            contact_name,
            contact_email,
            contact_phone,
            special_request,
            status,
            created_at,
            updated_at
        `,
        [
          userId,
          dto.tourDepartureId,
          dto.guestCount,
          unitPrice,
          dto.contactName.trim(),
          dto.contactEmail.trim(),
          dto.contactPhone,
          dto.specialRequest?.trim() || null,
        ],
      );

    const row = result.rows[0];

    if (!row) {
      throw new Error(
        'Booking creation returned no data.',
      );
    }

    return this.mapBooking(row);
  }

  private mapBooking(
    row: BookingRow,
  ): BookingRecord {
    return {
      id: row.id,
      userId: row.user_id,
      tourDepartureId:
        row.tour_departure_id,
      guestCount: row.guest_count,
      unitPrice: Number(row.unit_price),
      contactName: row.contact_name,
      contactEmail: row.contact_email,
      contactPhone: row.contact_phone,
      specialRequest: row.special_request,
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
  status:
    | 'SCHEDULED'
    | 'CLOSED'
    | 'CANCELLED'
    | 'COMPLETED';
}

interface ReservedSlotsRow {
  reserved_slots: number;
}

interface BookingRow {
  id: number;
  user_id: number;
  tour_departure_id: number;
  guest_count: number;
  unit_price: string | number;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  special_request: string | null;
  status:
    | 'PENDING'
    | 'CONFIRMED'
    | 'CANCELLED'
    | 'COMPLETED';
  created_at: Date;
  updated_at: Date;
}

