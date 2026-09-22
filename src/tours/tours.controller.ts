import {
  Body,
  Controller,
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
import { ToursService } from './tours.service';

@Controller('tours')
export class ToursController {
  constructor(
    private readonly toursService: ToursService,
  ) {}

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
}
