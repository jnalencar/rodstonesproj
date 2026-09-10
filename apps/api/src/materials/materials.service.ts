import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';

@Injectable()
export class MaterialsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateMaterialDto,
    user: AuthenticatedUser,
  ) {
    if (!user.companyId) {
      throw new NotFoundException(
        'Usuário não possui uma empresa selecionada',
      );
    }

    const existingMaterial = await this.prisma.material.findFirst({
      where: {
        companyId: user.companyId,
        name: dto.name,
        deletedAt: null,
      },
    });

    if (existingMaterial) {
      throw new ConflictException(
        'Já existe um material com este nome',
      );
    }

    return this.prisma.material.create({
      data: {
        companyId: user.companyId,
        name: dto.name,
        description: dto.description,
      },
    });
  }

  async findAll(user: AuthenticatedUser) {
    if (!user.companyId) {
      throw new NotFoundException(
        'Usuário não possui uma empresa selecionada',
      );
    }

    return this.prisma.material.findMany({
      where: {
        companyId: user.companyId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(
    id: number,
    user: AuthenticatedUser,
  ) {
    if (!user.companyId) {
      throw new NotFoundException(
        'Usuário não possui uma empresa selecionada',
      );
    }

    const material = await this.prisma.material.findFirst({
      where: {
        id,
        companyId: user.companyId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!material) {
      throw new NotFoundException(
        'Material não encontrado',
      );
    }

    return material;
  }

  async update(
    id: number,
    dto: UpdateMaterialDto,
    user: AuthenticatedUser,
  ) {
    if (!user.companyId) {
      throw new NotFoundException(
        'Usuário não possui uma empresa selecionada',
      );
    }

    const material = await this.prisma.material.findFirst({
      where: {
        id,
        companyId: user.companyId,
        deletedAt: null,
      },
    });

    if (!material) {
      throw new NotFoundException(
        'Material não encontrado',
      );
    }

    if (dto.name && dto.name !== material.name) {
      const existingMaterial =
        await this.prisma.material.findFirst({
          where: {
            companyId: user.companyId,
            name: dto.name,
            deletedAt: null,
            NOT: {
              id,
            },
          },
        });

      if (existingMaterial) {
        throw new ConflictException(
          'Já existe um material com este nome',
        );
      }
    }

    return this.prisma.material.update({
      where: {
        id: material.id,
      },
      data: {
        name: dto.name,
        description: dto.description,
      },
    });
  }

  async remove(
    id: number,
    user: AuthenticatedUser,
  ) {
    if (!user.companyId) {
      throw new NotFoundException(
        'Usuário não possui uma empresa selecionada',
      );
    }

    const material = await this.prisma.material.findFirst({
      where: {
        id,
        companyId: user.companyId,
        deletedAt: null,
      },
    });

    if (!material) {
      throw new NotFoundException(
        'Material não encontrado',
      );
    }

    await this.prisma.material.update({
      where: {
        id: material.id,
      },
      data: {
        status: 'INACTIVE',
        deletedAt: new Date(),
      },
    });

    return {
      message: 'Material excluído com sucesso',
    };
  }
}