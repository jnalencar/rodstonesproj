export interface AuthenticatedUser {
  userId: number;
  email: string;
  membershipId?: number | null;
  companyId?: number | null;
  roles: string[];
  permissions: string[];
}