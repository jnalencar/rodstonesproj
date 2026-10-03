import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { CreateMaterialClassificationDto } from './dto/create-material-classification.dto';
import { UpdateMaterialClassificationDto } from './dto/update-material-classification.dto';

@Injectable()
export class MaterialClassificationService {
  constructor(private readonly prisma: PrismaService) {}

  private getCompanyId(user: AuthenticatedUser): number {
    if (!user.companyId) {
      throw new ConflictException(
        'Usuário não possui uma empresa ativa.',
      );
    }

    return user.companyId;
  }

  async create(
    dto: CreateMaterialClassificationDto,
    user: AuthenticatedUser,
  ) {
    const companyId = this.getCompanyId(user);

    const name = dto.name.trim();

    const existing = await this.prisma.materialClassification.findFirst({
      where: {
        companyId,
        name,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ConflictException(
        'Já existe um tipo de material com esse nome.',
      );
    }

    return this.prisma.materialClassification.create({
      data: {
        companyId,
        name,
      },
    });
  }

  async findAll(user: AuthenticatedUser) {
    const companyId = this.getCompanyId(user);

    return this.prisma.materialClassification.findMany({
      where: {
        companyId,
        deletedAt: null,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(
    id: number,
    user: AuthenticatedUser,
  ) {
    const companyId = this.getCompanyId(user);

    const materialClassification = await this.prisma.materialClassification.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
    });

    if (!materialClassification) {
      throw new NotFoundException(
        'Classificação de material não encontrada.',
      );
    }

    return materialClassification;
  }

  async update(
    id: number,
    dto: UpdateMaterialClassificationDto,
    user: AuthenticatedUser,
  ) {
    const companyId = this.getCompanyId(user);

    const materialClassification = await this.prisma.materialClassification.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
    });

    if (!materialClassification) {
      throw new NotFoundException(
        'Classificação de material não encontrada.',
      );
    }

    if (dto.name !== undefined) {
      const name = dto.name.trim();

      const existing = await this.prisma.materialClassification.findFirst({
        where: {
          companyId,
          name,
          deletedAt: null,
          NOT: {
            id,
          },
        },
      });

      if (existing) {
        throw new ConflictException(
          'Já existe uma classificação de material com esse nome.',
        );
      }
    }

    return this.prisma.materialClassification.update({
      where: {
        id,
      },
      data: {
        ...(dto.name !== undefined && {
          name: dto.name.trim(),
        }),
      },
    });
  }

  async remove(
    id: number,
    user: AuthenticatedUser,
  ) {
    const companyId = this.getCompanyId(user);

    const materialClassification = await this.prisma.materialClassification.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
    });

    if (!materialClassification) {
      throw new NotFoundException(
        'Classificação de material não encontrada.',
      );
    }

    return this.prisma.materialClassification.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}