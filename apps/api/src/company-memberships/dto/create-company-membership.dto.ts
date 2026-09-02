import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateCompanyMembershipDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}