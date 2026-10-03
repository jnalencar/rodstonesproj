export interface JwtPayload {
  sub: string;
  email: string;

  membershipId?: number | null;
  companyId?: number | null;

  roles: string[];
  permissions: string[];
}