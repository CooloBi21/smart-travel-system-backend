import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthenticatedUser } from '../../auth/interfaces/auth-user.interface';
import {
  CompaniesRepository,
  CompanyRecord,
} from '../repositories/companies.repository';

export interface CompanyRequestContext {
  user?: AuthenticatedUser;
  company?: CompanyRecord;
}

@Injectable()
export class ActiveCompanyGuard implements CanActivate {
  constructor(
    private readonly companiesRepository: CompaniesRepository,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request =
      context.switchToHttp().getRequest<CompanyRequestContext>();

    const user = request.user;

    if (!user || user.roleCode !== 'COMPANY_ADMIN') {
      throw new ForbiddenException(
        'Chỉ COMPANY_ADMIN mới có vùng doanh nghiệp.',
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

    if (company.status !== 'ACTIVE') {
      throw new ForbiddenException(
        'Doanh nghiệp chưa ở trạng thái ACTIVE.',
      );
    }

    request.company = company;

    return true;
  }
}
