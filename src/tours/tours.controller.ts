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
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentCompany } from '../companies/decorators/current-company.decorator';
import { ActiveCompanyGuard } from '../companies/guards/active-company.guard';
import { CompanyRecord } from '../companies/repositories/companies.repository';
import { CreateTourDto } from './dto/create-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';
import { ToursService } from './tours.service';

@Controller('tours')
export class ToursController {
  constructor(
    private readonly toursService: ToursService,
  ) {}

  @Get('public')
  getPublishedTours() {
    return this.toursService.getPublishedTours();
  }

  @Get('public/:companySlug/:tourSlug')
  getPublishedTour(
    @Param('companySlug') companySlug: string,
    @Param('tourSlug') tourSlug: string,
  ) {
    return this.toursService.getPublishedTour(
      companySlug,
      tourSlug,
    );
  }

  @Post()
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
    ActiveCompanyGuard,
  )
  @Roles('COMPANY_ADMIN')
  createTour(
    @CurrentCompany() company: CompanyRecord,
    @Body() dto: CreateTourDto,
  ) {
    return this.toursService.createTour(
      company,
      dto,
    );
  }

  @Get('mine')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
    ActiveCompanyGuard,
  )
  @Roles('COMPANY_ADMIN')
  getMyTours(
    @CurrentCompany() company: CompanyRecord,
  ) {
    return this.toursService.getMyTours(company);
  }

  @Get('mine/:id')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
    ActiveCompanyGuard,
  )
  @Roles('COMPANY_ADMIN')
  getMyTourById(
    @CurrentCompany() company: CompanyRecord,
    @Param('id', ParseIntPipe) tourId: number,
  ) {
    return this.toursService.getMyTourById(
      company,
      tourId,
    );
  }

  @Patch('mine/:id')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
    ActiveCompanyGuard,
  )
  @Roles('COMPANY_ADMIN')
  updateMyTour(
    @CurrentCompany() company: CompanyRecord,
    @Param('id', ParseIntPipe) tourId: number,
    @Body() dto: UpdateTourDto,
  ) {
    return this.toursService.updateMyTour(
      company,
      tourId,
      dto,
    );
  }

  @Patch('mine/:id/publish')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
    ActiveCompanyGuard,
  )
  @Roles('COMPANY_ADMIN')
  publishMyTour(
    @CurrentCompany() company: CompanyRecord,
    @Param('id', ParseIntPipe) tourId: number,
  ) {
    return this.toursService.publishMyTour(
      company,
      tourId,
    );
  }

  @Patch('mine/:id/pause')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
    ActiveCompanyGuard,
  )
  @Roles('COMPANY_ADMIN')
  pauseMyTour(
    @CurrentCompany() company: CompanyRecord,
    @Param('id', ParseIntPipe) tourId: number,
  ) {
    return this.toursService.pauseMyTour(
      company,
      tourId,
    );
  }

  @Patch('mine/:id/archive')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
    ActiveCompanyGuard,
  )
  @Roles('COMPANY_ADMIN')
  archiveMyTour(
    @CurrentCompany() company: CompanyRecord,
    @Param('id', ParseIntPipe) tourId: number,
  ) {
    return this.toursService.archiveMyTour(
      company,
      tourId,
    );
  }
}
