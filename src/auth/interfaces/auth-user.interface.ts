export type RoleCode =
  | 'PLATFORM_ADMIN'
  | 'COMPANY_ADMIN'
  | 'CUSTOMER';

export interface JwtPayload {
  sub: number;
  email: string;
  roleCode: RoleCode;
}

export interface AuthenticatedUser {
  id: number;
  email: string;
  fullName: string;
  roleCode: RoleCode;
}
