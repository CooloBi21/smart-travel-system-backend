import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthenticatedUser } from '../auth/interfaces/auth-user.interface';
import { CreateCompanyDto } from './dto/create-company.dto';
import {
  CompaniesRepository,
  CompanyRecord,
} from './repositories/companies.repository';

@Injectable()
export class CompaniesService {
  constructor(
    private readonly companiesRepository: CompaniesRepository,
  ) {}

  async getAll(): Promise<CompanyRecord[]> {
    return this.companiesRepository.findAll();
  }

  async createCompany(
    user: AuthenticatedUser,
    dto: CreateCompanyDto,
  ) {
    if (user.roleCode !== 'COMPANY_ADMIN') {
      throw new ForbiddenException(
        'Chỉ tài khoản COMPANY_ADMIN mới được đăng ký doanh nghiệp.',
      );
    }

    const existingCompany =
      await this.companiesRepository.findByAccountUserId(
        user.id,
      );

    if (existingCompany) {
      throw new ConflictException(
        'Tài khoản này đã đại diện cho một doanh nghiệp.',
      );
    }

    const slug = dto.slug.trim().toLowerCase();

    const existingSlug =
      await this.companiesRepository.findBySlug(slug);

    if (existingSlug) {
      throw new ConflictException(
        'Slug doanh nghiệp đã được sử dụng.',
      );
    }

    try {
      return await this.companiesRepository.create({
        accountUserId: user.id,
        name: dto.name.trim(),
        slug,
        description:
          dto.description?.trim() || null,
        logoUrl:
          dto.logoUrl?.trim() || null,
        contactEmail:
          dto.contactEmail?.trim().toLowerCase() || null,
        contactPhone:
          dto.contactPhone?.trim() || null,
      });
    } catch (error) {
      if (
        this.isUniqueViolation(
          error,
          'uq_companies_account_user',
        )
      ) {
        throw new ConflictException(
          'Tài khoản này đã đại diện cho một doanh nghiệp.',
        );
      }

      if (
        this.isUniqueViolation(
          error,
          'uq_companies_slug',
        )
      ) {
        throw new ConflictException(
          'Slug doanh nghiệp đã được sử dụng.',
        );
      }

      throw error;
    }
  }

  async getMyCompany(
    user: AuthenticatedUser,
  ) {
    if (user.roleCode !== 'COMPANY_ADMIN') {
      throw new ForbiddenException(
        'Chỉ tài khoản COMPANY_ADMIN mới có vùng doanh nghiệp.',
      );
    }

    const company =
      await this.companiesRepository.findByAccountUserId(
        user.id,
      );

    if (!company) {
      throw new NotFoundException(
        'Tài khoản này chưa được liên kết với doanh nghiệp.',
      );
    }

    return company;
  }

  async approveCompany(
    user: AuthenticatedUser,
    companyId: number,
  ) {
    if (user.roleCode !== 'PLATFORM_ADMIN') {
      throw new ForbiddenException(
        'Chỉ PLATFORM_ADMIN mới được duyệt doanh nghiệp.',
      );
    }

    const company =
      await this.companiesRepository.findById(companyId);

    if (!company) {
      throw new NotFoundException(
        'Không tìm thấy doanh nghiệp.',
      );
    }

    if (company.status !== 'PENDING') {
      throw new BadRequestException(
        'Chỉ doanh nghiệp ở trạng thái PENDING mới được duyệt.',
      );
    }

    const updatedCompany =
      await this.companiesRepository.updateStatus(
        company.id,
        'ACTIVE',
      );

    if (!updatedCompany) {
      throw new NotFoundException(
        'Không tìm thấy doanh nghiệp.',
      );
    }

    return updatedCompany;
  }

  private isUniqueViolation(
    error: unknown,
    constraint: string,
  ): boolean {
    if (
      typeof error !== 'object' ||
      error === null
    ) {
      return false;
    }

    const postgresError = error as {
      code?: unknown;
      constraint?: unknown;
    };

    return (
      postgresError.code === '23505' &&
      postgresError.constraint === constraint
    );
  }
}
