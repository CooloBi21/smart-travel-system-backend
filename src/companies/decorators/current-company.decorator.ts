import {
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { CompanyRecord } from '../repositories/companies.repository';

export const CurrentCompany = createParamDecorator(
  (
    _data: unknown,
    context: ExecutionContext,
  ): CompanyRecord => {
    const request = context.switchToHttp().getRequest<{
      company: CompanyRecord;
    }>();

    return request.company;
  },
);
