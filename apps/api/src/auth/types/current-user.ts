export interface CurrentUser {
  userId: number;
  email: string;
  membershipId?: number | null;
  companyId?: number | null;
  partnerId?: number | null;
}