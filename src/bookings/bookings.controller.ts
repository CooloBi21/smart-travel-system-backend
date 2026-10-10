import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateCompanyBookingStatusDto } from './dto/update-company-booking-status.dto';
import { BookingStatus } from './repositories/bookings.repository';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/auth-user.interface';

import { CurrentCompany } from '../companies/decorators/current-company.decorator';
import { ActiveCompanyGuard } from '../companies/guards/active-company.guard';

import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

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

  // Company routes phải đứng trước /:bookingId
  @Get('company')
  @UseGuards(RolesGuard, ActiveCompanyGuard)
  @Roles('COMPANY_ADMIN')
  async getCompanyBookings(
    @CurrentCompany() company: { id: number },
  ) {
    return this.bookingsService.getCompanyBookings(
      company.id,
    );
  }

  @Get('company/:bookingId')
  @UseGuards(RolesGuard, ActiveCompanyGuard)
  @Roles('COMPANY_ADMIN')
  async getCompanyBookingById(
    @CurrentCompany() company: { id: number },
    @Param('bookingId', ParseIntPipe)
    bookingId: number,
  ) {
    return this.bookingsService.getCompanyBookingById(
      company.id,
      bookingId,
    );
  }

  @Patch('company/:bookingId/status')
  @UseGuards(RolesGuard, ActiveCompanyGuard)
  @Roles('COMPANY_ADMIN')
  async updateCompanyBookingStatus(
    @CurrentCompany() company: { id: number },
    @Param('bookingId', ParseIntPipe)
    bookingId: number,
    @Body() dto: UpdateCompanyBookingStatusDto,
  ) {
    return this.bookingsService.updateCompanyBookingStatus(
      company.id,
      bookingId,
      dto.status as BookingStatus,
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
