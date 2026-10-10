import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export type CompanyStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'ARCHIVED';

export interface CompanyRecord {
  id: number;
  accountUserId: number;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  status: CompanyStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCompanyInput {
  accountUserId: number;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
}

@Injectable()
export class CompaniesRepository {
  constructor(
    private readonly databaseService: DatabaseService,
  ) {}

  async findAll(): Promise<CompanyRecord[]> {
    const result = await this.databaseService.query<{
      id: number;
      account_user_id: number;
      name: string;
      slug: string;
      description: string | null;
      logo_url: string | null;
      contact_email: string | null;
      contact_phone: string | null;
      status: CompanyStatus;
      created_at: Date;
      updated_at: Date;
    }>(
      `
        SELECT
          id,
          account_user_id,
          name,
          slug,
          description,
          logo_url,
          contact_email,
          contact_phone,
          status,
          created_at,
          updated_at
        FROM public.companies
        ORDER BY
          CASE status
            WHEN 'PENDING' THEN 1
            WHEN 'ACTIVE' THEN 2
            WHEN 'SUSPENDED' THEN 3
            WHEN 'ARCHIVED' THEN 4
            ELSE 5
          END,
          name ASC,
          id ASC
      `,
    );

    return result.rows.map((company) =>
      this.mapCompany(company),
    );
  }

  async findById(
    id: number,
  ): Promise<CompanyRecord | null> {
    const result = await this.databaseService.query<{
      id: number;
      account_user_id: number;
      name: string;
      slug: string;
      description: string | null;
      logo_url: string | null;
      contact_email: string | null;
      contact_phone: string | null;
      status: CompanyStatus;
      created_at: Date;
      updated_at: Date;
    }>(
      `
        SELECT
          id,
          account_user_id,
          name,
          slug,
          description,
          logo_url,
          contact_email,
          contact_phone,
          status,
          created_at,
          updated_at
        FROM public.companies
        WHERE id = $1
        LIMIT 1
      `,
      [id],
    );

    const company = result.rows[0];

    if (!company) {
      return null;
    }

    return this.mapCompany(company);
  }

  async findByAccountUserId(
    accountUserId: number,
  ): Promise<CompanyRecord | null> {
    const result = await this.databaseService.query<{
      id: number;
      account_user_id: number;
      name: string;
      slug: string;
      description: string | null;
      logo_url: string | null;
      contact_email: string | null;
      contact_phone: string | null;
      status: CompanyStatus;
      created_at: Date;
      updated_at: Date;
    }>(
      `
        SELECT
          id,
          account_user_id,
          name,
          slug,
          description,
          logo_url,
          contact_email,
          contact_phone,
          status,
          created_at,
          updated_at
        FROM public.companies
        WHERE account_user_id = $1
        LIMIT 1
      `,
      [accountUserId],
    );

    const company = result.rows[0];

    if (!company) {
      return null;
    }

    return this.mapCompany(company);
  }

  async findBySlug(
    slug: string,
  ): Promise<CompanyRecord | null> {
    const result = await this.databaseService.query<{
      id: number;
      account_user_id: number;
      name: string;
      slug: string;
      description: string | null;
      logo_url: string | null;
      contact_email: string | null;
      contact_phone: string | null;
      status: CompanyStatus;
      created_at: Date;
      updated_at: Date;
    }>(
      `
        SELECT
          id,
          account_user_id,
          name,
          slug,
          description,
          logo_url,
          contact_email,
          contact_phone,
          status,
          created_at,
          updated_at
        FROM public.companies
        WHERE slug = $1
        LIMIT 1
      `,
      [slug],
    );

    const company = result.rows[0];

    if (!company) {
      return null;
    }

    return this.mapCompany(company);
  }

  async create(
    input: CreateCompanyInput,
  ): Promise<CompanyRecord> {
    const result = await this.databaseService.query<{
      id: number;
      account_user_id: number;
      name: string;
      slug: string;
      description: string | null;
      logo_url: string | null;
      contact_email: string | null;
      contact_phone: string | null;
      status: CompanyStatus;
      created_at: Date;
      updated_at: Date;
    }>(
      `
        INSERT INTO public.companies (
          account_user_id,
          name,
          slug,
          description,
          logo_url,
          contact_email,
          contact_phone,
          status
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          'PENDING'
        )
        RETURNING
          id,
          account_user_id,
          name,
          slug,
          description,
          logo_url,
          contact_email,
          contact_phone,
          status,
          created_at,
          updated_at
      `,
      [
        input.accountUserId,
        input.name,
        input.slug,
        input.description,
        input.logoUrl,
        input.contactEmail,
        input.contactPhone,
      ],
    );

    const company = result.rows[0];

    if (!company) {
      throw new Error(
        'Company creation returned no data.',
      );
    }

    return this.mapCompany(company);
  }

  async updateStatus(
    id: number,
    status: CompanyStatus,
  ): Promise<CompanyRecord | null> {
    const result = await this.databaseService.query<{
      id: number;
      account_user_id: number;
      name: string;
      slug: string;
      description: string | null;
      logo_url: string | null;
      contact_email: string | null;
      contact_phone: string | null;
      status: CompanyStatus;
      created_at: Date;
      updated_at: Date;
    }>(
      `
        UPDATE public.companies
        SET status = $2
        WHERE id = $1
        RETURNING
          id,
          account_user_id,
          name,
          slug,
          description,
          logo_url,
          contact_email,
          contact_phone,
          status,
          created_at,
          updated_at
      `,
      [
        id,
        status,
      ],
    );

    const company = result.rows[0];

    if (!company) {
      return null;
    }

    return this.mapCompany(company);
  }

  private mapCompany(row: {
    id: number;
    account_user_id: number;
    name: string;
    slug: string;
    description: string | null;
    logo_url: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    status: CompanyStatus;
    created_at: Date;
    updated_at: Date;
  }): CompanyRecord {
    return {
      id: row.id,
      accountUserId: row.account_user_id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      logoUrl: row.logo_url,
      contactEmail: row.contact_email,
      contactPhone: row.contact_phone,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
