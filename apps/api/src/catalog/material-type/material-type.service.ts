import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { CreateMaterialTypeDto } from './dto/create-material-type.dto';
import { UpdateMaterialTypeDto } from './dto/update-material-type.dto';

@Injectable()
export class MaterialTypeService {
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
    dto: CreateMaterialTypeDto,
    user: AuthenticatedUser,
  ) {
    const companyId = this.getCompanyId(user);

    const name = dto.name.trim();

    const existing = await this.prisma.materialType.findFirst({
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

    return this.prisma.materialType.create({
      data: {
        companyId,
        name,
      },
    });
  }

  async findAll(user: AuthenticatedUser) {
    const companyId = this.getCompanyId(user);

    return this.prisma.materialType.findMany({
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

    const materialType = await this.prisma.materialType.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
    });

    if (!materialType) {
      throw new NotFoundException(
        'Tipo de material não encontrado.',
      );
    }

    return materialType;
  }

  async update(
    id: number,
    dto: UpdateMaterialTypeDto,
    user: AuthenticatedUser,
  ) {
    const companyId = this.getCompanyId(user);

    const materialType = await this.prisma.materialType.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
    });

    if (!materialType) {
      throw new NotFoundException(
        'Tipo de material não encontrado.',
      );
    }

    if (dto.name !== undefined) {
      const name = dto.name.trim();

      const existing = await this.prisma.materialType.findFirst({
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
          'Já existe um tipo de material com esse nome.',
        );
      }
    }

    return this.prisma.materialType.update({
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

    const materialType = await this.prisma.materialType.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
    });

    if (!materialType) {
      throw new NotFoundException(
        'Tipo de material não encontrado.',
      );
    }

    return this.prisma.materialType.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}