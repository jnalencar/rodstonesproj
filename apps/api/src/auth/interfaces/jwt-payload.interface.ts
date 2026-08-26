export interface JwtPayload {
  sub: number;
  email: string;
  membershipId?: number | null;
  companyId?: number | null;
  roles: string[];
  permissions: string[];
}