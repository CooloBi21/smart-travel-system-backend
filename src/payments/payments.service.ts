import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  PaymentRecord,
  PaymentsRepository,
  PaymentStatus,
} from './repositories/payments.repository';
import { SimulatePaymentDto } from './dto/simulate-payment.dto';

interface BookingPaymentContext {
  id: number;
  userId: number;
  guestCount: number;
  unitPrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
}

@Injectable()
export class PaymentsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly paymentsRepository: PaymentsRepository,
  ) {}

  async createPayment(
    userId: number,
    bookingId: number,
  ): Promise<{
    payment: PaymentRecord;
    totalAmount: number;
  }> {
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new BadRequestException('Invalid authenticated user.');
    }

    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      throw new BadRequestException('Invalid booking ID.');
    }

    return this.databaseService.withTransaction(async (client) => {
      const bookingResult = await client.query<BookingPaymentContext>(
        `
          SELECT
            id,
            user_id AS "userId",
            guest_count AS "guestCount",
            unit_price AS "unitPrice",
            status
          FROM public.bookings
          WHERE id = $1
          FOR UPDATE
        `,
        [bookingId],
      );

      const booking = bookingResult.rows[0];

      if (!booking) {
        throw new NotFoundException('Booking not found.');
      }

      if (booking.userId !== userId) {
        throw new ForbiddenException(
          'You are not allowed to pay for this booking.',
        );
      }

      if (booking.status !== 'PENDING') {
        throw new BadRequestException(
          `Booking cannot be paid because its current status is "${booking.status}".`,
        );
      }

      const successfulPaymentResult = await client.query(
        `
          SELECT id
          FROM public.payments
          WHERE booking_id = $1
            AND status = 'SUCCESS'
          LIMIT 1
        `,
        [bookingId],
      );

      if (successfulPaymentResult.rows[0]) {
        throw new BadRequestException(
          'This booking has already been paid successfully.',
        );
      }

      const totalAmount =
        Number(booking.guestCount) * Number(booking.unitPrice);

      if (!Number.isFinite(totalAmount) || totalAmount < 0) {
        throw new BadRequestException(
          'Unable to calculate the booking payment amount.',
        );
      }

      const paymentResult = await client.query(
        `
          INSERT INTO public.payments (
            booking_id,
            amount,
            currency,
            payment_method,
            status
          )
          VALUES ($1, $2, 'VND', 'SIMULATED', 'PENDING')
          RETURNING
            id,
            booking_id AS "bookingId",
            amount,
            currency,
            payment_method AS "paymentMethod",
            status,
            transaction_reference AS "transactionReference",
            paid_at AS "paidAt",
            failure_reason AS "failureReason",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
        `,
        [bookingId, totalAmount],
      );

      const payment = paymentResult.rows[0] as PaymentRecord;

      return {
        payment,
        totalAmount,
      };
    });
  }

  async simulatePayment(
    userId: number,
    paymentId: number,
    dto: SimulatePaymentDto,
  ): Promise<PaymentRecord> {
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new BadRequestException('Invalid authenticated user.');
    }

    if (!Number.isInteger(paymentId) || paymentId <= 0) {
      throw new BadRequestException('Invalid payment ID.');
    }

    return this.databaseService.withTransaction(async (client) => {
      const paymentResult = await client.query<{
        id: number;
        bookingId: number;
        amount: number;
        currency: string;
        paymentMethod: 'SIMULATED';
        status: PaymentStatus;
        transactionReference: string | null;
        paidAt: Date | null;
        failureReason: string | null;
        createdAt: Date;
        updatedAt: Date;
        userId: number;
        bookingStatus:
          | 'PENDING'
          | 'CONFIRMED'
          | 'CANCELLED'
          | 'COMPLETED';
      }>(
        `
          SELECT
            p.id,
            p.booking_id AS "bookingId",
            p.amount,
            p.currency,
            p.payment_method AS "paymentMethod",
            p.status,
            p.transaction_reference AS "transactionReference",
            p.paid_at AS "paidAt",
            p.failure_reason AS "failureReason",
            p.created_at AS "createdAt",
            p.updated_at AS "updatedAt",
            b.user_id AS "userId",
            b.status AS "bookingStatus"
          FROM public.payments p
          INNER JOIN public.bookings b
            ON b.id = p.booking_id
          WHERE p.id = $1
          FOR UPDATE OF p, b
        `,
        [paymentId],
      );

      const payment = paymentResult.rows[0];

      if (!payment) {
        throw new NotFoundException('Payment not found.');
      }

      if (payment.userId !== userId) {
        throw new ForbiddenException(
          'You are not allowed to process this payment.',
        );
      }

      if (payment.status !== 'PENDING') {
        throw new BadRequestException(
          `Payment cannot be processed because its current status is "${payment.status}".`,
        );
      }

      if (payment.bookingStatus !== 'PENDING') {
        throw new BadRequestException(
          `Booking cannot be paid because its current status is "${payment.bookingStatus}".`,
        );
      }

      if (dto.result === 'SUCCESS') {
        const transactionReference = this.generateTransactionReference();

        const updatedPaymentResult = await client.query(
          `
            UPDATE public.payments
            SET
              status = 'SUCCESS',
              transaction_reference = $2,
              paid_at = NOW(),
              failure_reason = NULL
            WHERE id = $1
            RETURNING
              id,
              booking_id AS "bookingId",
              amount,
              currency,
              payment_method AS "paymentMethod",
              status,
              transaction_reference AS "transactionReference",
              paid_at AS "paidAt",
              failure_reason AS "failureReason",
              created_at AS "createdAt",
              updated_at AS "updatedAt"
          `,
          [paymentId, transactionReference],
        );

        const updatedPayment =
          updatedPaymentResult.rows[0] as PaymentRecord;

        await client.query(
          `
            UPDATE public.bookings
            SET
              status = 'CONFIRMED',
              confirmed_at = NOW()
            WHERE id = $1
              AND status = 'PENDING'
          `,
          [payment.bookingId],
        );

        return updatedPayment;
      }

      const failureReason =
        dto.failureReason?.trim() || 'Simulated payment failed.';

      const updatedPaymentResult = await client.query(
        `
          UPDATE public.payments
          SET
            status = 'FAILED',
            failure_reason = $2,
            paid_at = NULL,
            transaction_reference = NULL
          WHERE id = $1
          RETURNING
            id,
            booking_id AS "bookingId",
            amount,
            currency,
            payment_method AS "paymentMethod",
            status,
            transaction_reference AS "transactionReference",
            paid_at AS "paidAt",
            failure_reason AS "failureReason",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
        `,
        [paymentId, failureReason],
      );

      return updatedPaymentResult.rows[0] as PaymentRecord;
    });
  }

  private generateTransactionReference(): string {
    const timestamp = Date.now();
    const randomPart = Math.random()
      .toString(36)
      .slice(2, 10)
      .toUpperCase();

    return `SIM-${timestamp}-${randomPart}`;
  }
}
