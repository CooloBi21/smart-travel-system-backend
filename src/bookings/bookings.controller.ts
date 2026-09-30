import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/auth-user.interface';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
  ) {}

  @Get()
  async getMyBookings(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.bookingsService.getMyBookings(
      user.id,
    );
  }

  @Get(':bookingId')
  async getMyBookingById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('bookingId', ParseIntPipe)
    bookingId: number,
  ) {
    return this.bookingsService.getMyBookingById(
      user.id,
      bookingId,
    );
  }

  @Post()
  
  async createBooking(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateBookingDto,
  ) {
    return this.bookingsService.createBooking(
      user.id,
      dto,
    );
  }
}
