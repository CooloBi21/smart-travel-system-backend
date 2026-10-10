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
import { AuthenticatedUser } from '../auth/interfaces/auth-user.interface';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { CurrentCompany } from './decorators/current-company.decorator';
import { ActiveCompanyGuard } from './guards/active-company.guard';
import { CompanyRecord } from './repositories/companies.repository';

@Controller('companies')
export class CompaniesController {
  constructor(
    private readonly companiesService: CompaniesService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLATFORM_ADMIN')
  async getAll() {
    return this.companiesService.getAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('COMPANY_ADMIN')
  createCompany(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCompanyDto,
  ) {
    return this.companiesService.createCompany(
      user,
      dto,
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('COMPANY_ADMIN')
  getMyCompany(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.companiesService.getMyCompany(user);
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLATFORM_ADMIN')
  approveCompany(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) companyId: number,
  ) {
    return this.companiesService.approveCompany(
      user,
      companyId,
    );
  }

  @Get('active-context')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
    ActiveCompanyGuard,
  )
  @Roles('COMPANY_ADMIN')
  getActiveContext(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentCompany() company: CompanyRecord,
  ) {
    return {
      status: 'success',
      user: {
        id: user.id,
        email: user.email,
        roleCode: user.roleCode,
      },
      company: {
        id: company.id,
        accountUserId: company.accountUserId,
        name: company.name,
        slug: company.slug,
        status: company.status,
      },
    };
  }
}
