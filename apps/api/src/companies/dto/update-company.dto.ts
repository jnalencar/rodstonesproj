import { IsEmail, IsOptional, IsString, Length, Matches} from 'class-validator';

export class UpdateCompanyDto{
    @IsOptional()
    @IsString()
    @Length(2, 150)
    name?: string;

    @IsOptional()
    @IsString()
    @Length(2, 200)
    legalName?: string;

    @IsOptional()
    @IsString()
    @Length(8, 30)
    document?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    @Length(8, 30)
    phone?: string;
}