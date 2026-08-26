import {
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';

@Injectable()
export class CompaniesService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreateCompanyDto) {
    if (dto.document) {
      const existingCompany =
        await this.prisma.company.findUnique({
          where: {
            document: dto.document,
          },
        });

      if (existingCompany) {
        throw new ConflictException(
          'Já existe uma empresa cadastrada com este documento',
        );
      }
    }

    const company =
      await this.prisma.company.create({
        data: {
          name: dto.name,
          legalName: dto.legalName,
          document: dto.document,
          email: dto.email,
          phone: dto.phone,
        },
      });

    return company;
  }
}