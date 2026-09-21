import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { RoleCode } from '../interfaces/auth-user.interface';

export interface AuthUserRecord {
  id: number;
  email: string;
  passwordHash: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  roleCode: RoleCode;
}

export interface CreateCustomerInput {
  email: string;
  passwordHash: string;
  fullName: string;
  phone: string | null;
}

@Injectable()
export class UsersRepository {
  constructor(
    private readonly databaseService: DatabaseService,
  ) {}

  async findByEmail(
    email: string,
  ): Promise<AuthUserRecord | null> {
    const result = await this.databaseService.query<{
      id: number;
      email: string;
      password_hash: string;
      full_name: string;
      phone: string | null;
      avatar_url: string | null;
      is_active: boolean;
      role_code: RoleCode;
    }>(
      `
        SELECT
          u.id,
          u.email,
          u.password_hash,
          u.full_name,
          u.phone,
          u.avatar_url,
          u.is_active,
          r.code AS role_code
        FROM public.users u
        INNER JOIN public.roles r
          ON r.id = u.role_id
        WHERE LOWER(u.email) = LOWER($1)
        LIMIT 1
      `,
      [email],
    );

    const user = result.rows[0];

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      passwordHash: user.password_hash,
      fullName: user.full_name,
      phone: user.phone,
      avatarUrl: user.avatar_url,
      isActive: user.is_active,
      roleCode: user.role_code,
    };
  }

  async findById(
    id: number,
  ): Promise<AuthUserRecord | null> {
    const result = await this.databaseService.query<{
      id: number;
      email: string;
      password_hash: string;
      full_name: string;
      phone: string | null;
      avatar_url: string | null;
      is_active: boolean;
      role_code: RoleCode;
    }>(
      `
        SELECT
          u.id,
          u.email,
          u.password_hash,
          u.full_name,
          u.phone,
          u.avatar_url,
          u.is_active,
          r.code AS role_code
        FROM public.users u
        INNER JOIN public.roles r
          ON r.id = u.role_id
        WHERE u.id = $1
        LIMIT 1
      `,
      [id],
    );

    const user = result.rows[0];

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      passwordHash: user.password_hash,
      fullName: user.full_name,
      phone: user.phone,
      avatarUrl: user.avatar_url,
      isActive: user.is_active,
      roleCode: user.role_code,
    };
  }

  async createCustomer(
    input: CreateCustomerInput,
  ): Promise<AuthUserRecord> {
    const result = await this.databaseService.query<{
      id: number;
      email: string;
      password_hash: string;
      full_name: string;
      phone: string | null;
      avatar_url: string | null;
      is_active: boolean;
      role_code: RoleCode;
    }>(
      `
        WITH customer_role AS (
          SELECT id
          FROM public.roles
          WHERE code = 'CUSTOMER'
          LIMIT 1
        ),
        inserted_user AS (
          INSERT INTO public.users (
            role_id,
            email,
            password_hash,
            full_name,
            phone
          )
          SELECT
            customer_role.id,
            $1,
            $2,
            $3,
            $4
          FROM customer_role
          RETURNING
            id,
            role_id,
            email,
            password_hash,
            full_name,
            phone,
            avatar_url,
            is_active
        )
        SELECT
          u.id,
          u.email,
          u.password_hash,
          u.full_name,
          u.phone,
          u.avatar_url,
          u.is_active,
          r.code AS role_code
        FROM inserted_user u
        INNER JOIN public.roles r
          ON r.id = u.role_id
      `,
      [
        input.email,
        input.passwordHash,
        input.fullName,
        input.phone,
      ],
    );

    const user = result.rows[0];

    if (!user) {
      throw new Error(
        'CUSTOMER role is missing or user creation failed.',
      );
    }

    return {
      id: user.id,
      email: user.email,
      passwordHash: user.password_hash,
      fullName: user.full_name,
      phone: user.phone,
      avatarUrl: user.avatar_url,
      isActive: user.is_active,
      roleCode: user.role_code,
    };
  }
}
