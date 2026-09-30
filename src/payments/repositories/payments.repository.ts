import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export type PaymentStatus =
  | 'PENDING'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELLED';

export type PaymentMethod =
  | 'SIMULATED';

export interface PaymentRecord {
  id: number;
  bookingId: number;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  transactionReference: string | null;
  paidAt: Date | null;
  failureReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentData {
  bookingId: number;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  transactionReference?: string | null;
}

export interface UpdatePaymentStatusData {
  status: PaymentStatus;
  transactionReference?: string | null;
  paidAt?: Date | null;
  failureReason?: string | null;
}

@Injectable()
export class PaymentsRepository {
  constructor(
    private readonly databaseService: DatabaseService,
  ) {}

  async findById(
    id: number,
  ): Promise<PaymentRecord | null> {
    const result =
      await this.databaseService.query<PaymentRow>(
        `
          SELECT
            id,
            booking_id,
            amount,
            currency,
            payment_method,
            status,
            transaction_reference,
            paid_at,
            failure_reason,
            created_at,
            updated_at
          FROM public.payments
          WHERE id = $1
        `,
        [id],
      );

    const row = result.rows[0];

    return row ? this.mapPayment(row) : null;
  }

  async findByBookingId(
    bookingId: number,
  ): Promise<PaymentRecord[]> {
    const result =
      await this.databaseService.query<PaymentRow>(
        `
          SELECT
            id,
            booking_id,
            amount,
            currency,
            payment_method,
            status,
            transaction_reference,
            paid_at,
            failure_reason,
            created_at,
            updated_at
          FROM public.payments
          WHERE booking_id = $1
          ORDER BY created_at DESC, id DESC
        `,
        [bookingId],
      );

    return result.rows.map((row) =>
      this.mapPayment(row),
    );
  }

  async findSuccessfulByBookingId(
    bookingId: number,
  ): Promise<PaymentRecord | null> {
    const result =
      await this.databaseService.query<PaymentRow>(
        `
          SELECT
            id,
            booking_id,
            amount,
            currency,
            payment_method,
            status,
            transaction_reference,
            paid_at,
            failure_reason,
            created_at,
            updated_at
          FROM public.payments
          WHERE booking_id = $1
            AND status = 'SUCCESS'
          LIMIT 1
        `,
        [bookingId],
      );

    const row = result.rows[0];

    return row ? this.mapPayment(row) : null;
  }

  async create(
    data: CreatePaymentData,
  ): Promise<PaymentRecord> {
    const result =
      await this.databaseService.query<PaymentRow>(
        `
          INSERT INTO public.payments (
            booking_id,
            amount,
            currency,
            payment_method,
            transaction_reference
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5
          )
          RETURNING
            id,
            booking_id,
            amount,
            currency,
            payment_method,
            status,
            transaction_reference,
            paid_at,
            failure_reason,
            created_at,
            updated_at
        `,
        [
          data.bookingId,
          data.amount,
          data.currency,
          data.paymentMethod,
          data.transactionReference ?? null,
        ],
      );

    const row = result.rows[0];

    if (!row) {
      throw new Error(
        'Payment creation returned no data.',
      );
    }

    return this.mapPayment(row);
  }

  async updateStatus(
    id: number,
    data: UpdatePaymentStatusData,
  ): Promise<PaymentRecord | null> {
    const result =
      await this.databaseService.query<PaymentRow>(
        `
          UPDATE public.payments
          SET
            status = $2,
            transaction_reference = COALESCE(
              $3,
              transaction_reference
            ),
            paid_at = $4,
            failure_reason = $5
          WHERE id = $1
          RETURNING
            id,
            booking_id,
            amount,
            currency,
            payment_method,
            status,
            transaction_reference,
            paid_at,
            failure_reason,
            created_at,
            updated_at
        `,
        [
          id,
          data.status,
          data.transactionReference ?? null,
          data.paidAt ?? null,
          data.failureReason ?? null,
        ],
      );

    const row = result.rows[0];

    return row ? this.mapPayment(row) : null;
  }

  private mapPayment(
    row: PaymentRow,
  ): PaymentRecord {
    return {
      id: row.id,
      bookingId: row.booking_id,
      amount: Number(row.amount),
      currency: row.currency,
      paymentMethod: row.payment_method,
      status: row.status,
      transactionReference:
        row.transaction_reference,
      paidAt: row.paid_at,
      failureReason: row.failure_reason,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

interface PaymentRow {
  id: number;
  booking_id: number;
  amount: string | number;
  currency: string;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  transaction_reference: string | null;
  paid_at: Date | null;
  failure_reason: string | null;
  created_at: Date;
  updated_at: Date;
}
