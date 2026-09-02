import { MembershipStatus } from 'generated/prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateCompanyMembershipDto {
  @IsEnum(MembershipStatus)
  status!: MembershipStatus;
}
