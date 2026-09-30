import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentCompany } from '../companies/decorators/current-company.decorator';
import { ActiveCompanyGuard } from '../companies/guards/active-company.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { CreateDepartureDto } from './dto/create-departure.dto';
import { UpdateDepartureDto } from './dto/update-departure.dto';
import { DeparturesService } from './departures.service';
import { DepartureStatus } from './repositories/departures.repository';

interface ActiveCompany {
  id: number;
}

@Controller('tours/:tourId/departures')
@UseGuards(
  JwtAuthGuard,
  RolesGuard,
  ActiveCompanyGuard,
)
@Roles('COMPANY_ADMIN')
export class DeparturesController {
  constructor(
    private readonly departuresService: DeparturesService,
  ) {}

  @Get()
  getDepartures(
    @CurrentCompany() company: ActiveCompany,
    @Param('tourId', ParseIntPipe) tourId: number,
  ) {
    return this.departuresService.getDepartures(
      company,
      tourId,
    );
  }

  @Get(':departureId')
  getDeparture(
    @CurrentCompany() company: ActiveCompany,
    @Param('tourId', ParseIntPipe) tourId: number,
    @Param('departureId', ParseIntPipe) departureId: number,
  ) {
    return this.departuresService.getDeparture(
      company,
      tourId,
      departureId,
    );
  }

  @Post()
  createDeparture(
    @CurrentCompany() company: ActiveCompany,
    @Param('tourId', ParseIntPipe) tourId: number,
    @Body() dto: CreateDepartureDto,
  ) {
    return this.departuresService.createDeparture(
      company,
      tourId,
      {
        tourId,
        departureDate: dto.departureDate,
        pricePerPerson: dto.pricePerPerson,
        capacity: dto.capacity,
      },
    );
  }

  @Patch(':departureId')
  updateDeparture(
    @CurrentCompany() company: ActiveCompany,
    @Param('tourId', ParseIntPipe) tourId: number,
    @Param('departureId', ParseIntPipe) departureId: number,
    @Body() dto: UpdateDepartureDto,
  ) {
    return this.departuresService.updateDeparture(
      company,
      tourId,
      departureId,
      {
        departureDate: dto.departureDate,
        pricePerPerson: dto.pricePerPerson,
        capacity: dto.capacity,
      },
    );
  }

  @Patch(':departureId/status')
  updateDepartureStatus(
    @CurrentCompany() company: ActiveCompany,
    @Param('tourId', ParseIntPipe) tourId: number,
    @Param('departureId', ParseIntPipe) departureId: number,
    @Body('status') status: DepartureStatus,
  ) {
    return this.departuresService.updateDepartureStatus(
      company,
      tourId,
      departureId,
      status,
    );
  }

  @Delete(':departureId')
  deleteDeparture(
    @CurrentCompany() company: ActiveCompany,
    @Param('tourId', ParseIntPipe) tourId: number,
    @Param('departureId', ParseIntPipe) departureId: number,
  ) {
    return this.departuresService.deleteDeparture(
      company,
      tourId,
      departureId,
    );
  }
}
