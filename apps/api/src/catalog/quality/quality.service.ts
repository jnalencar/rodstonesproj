import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';

import { CreateQualityDto } from './dto/create-quality.dto';
import { UpdateQualityDto } from './dto/update-quality.dto';

@Injectable()
export class QualityService {
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
    dto: CreateQualityDto,
    user: AuthenticatedUser,
  ) {
    const companyId = this.getCompanyId(user);

    const name = dto.name.trim();

    const existing = await this.prisma.quality.findFirst({
      where: {
        companyId,
        name,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ConflictException(
        'Já existe uma qualidade com esse nome.',
      );
    }

    return this.prisma.quality.create({
      data: {
        companyId,
        name,
      },
    });
  }

  async findAll(user: AuthenticatedUser) {
    const companyId = this.getCompanyId(user);

    return this.prisma.quality.findMany({
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

    const quality = await this.prisma.quality.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
    });

    if (!quality) {
      throw new NotFoundException(
        'Qualidade não encontrada.',
      );
    }

    return quality;
  }

  async update(
    id: number,
    dto: UpdateQualityDto,
    user: AuthenticatedUser,
  ) {
    const companyId = this.getCompanyId(user);

    const quality = await this.prisma.quality.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
    });

    if (!quality) {
      throw new NotFoundException(
        'Qualidade não encontrada.',
      );
    }

    if (dto.name !== undefined) {
      const name = dto.name.trim();

      const existing = await this.prisma.quality.findFirst({
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
          'Já existe uma qualidade com esse nome.',
        );
      }
    }

    return this.prisma.quality.update({
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

    const quality = await this.prisma.quality.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
    });

    if (!quality) {
      throw new NotFoundException(
        'Qualidade não encontrada.',
      );
    }

    return this.prisma.quality.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}