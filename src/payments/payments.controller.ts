import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/interfaces/auth-user.interface';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { SimulatePaymentDto } from './dto/simulate-payment.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
  ) {}

  @Post()
  async createPayment(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymentsService.createPayment(
      user.id,
      dto.bookingId,
    );
  }

  @Post(':paymentId/simulate')
  async simulatePayment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('paymentId', ParseIntPipe) paymentId: number,
    @Body() dto: SimulatePaymentDto,
  ) {
    return this.paymentsService.simulatePayment(
      user.id,
      paymentId,
      dto,
    );
  }
}
