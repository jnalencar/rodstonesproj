import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { CreateFinishDto } from './dto/create-finish.dto';
import { UpdateFinishDto } from './dto/update-finish.dto';

@Injectable()
export class FinishService {
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
    dto: CreateFinishDto,
    user: AuthenticatedUser,
  ) {
    const companyId = this.getCompanyId(user);

    const name = dto.name.trim();

    const existing = await this.prisma.finish.findFirst({
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

    return this.prisma.finish.create({
      data: {
        companyId,
        name,
      },
    });
  }

  async findAll(user: AuthenticatedUser) {
    const companyId = this.getCompanyId(user);

    return this.prisma.finish.findMany({
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

    const finish = await this.prisma.finish.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
    });

    if (!finish) {
      throw new NotFoundException(
        'Tipo de acabamento não encontrado.',
      );
    }

    return finish;
  }

  async update(
    id: number,
    dto: UpdateFinishDto,
    user: AuthenticatedUser,
  ) {
    const companyId = this.getCompanyId(user);

    const finish = await this.prisma.finish.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
    });

    if (!finish) {
      throw new NotFoundException(
        'Tipo de acabamento não encontrado.',
      );
    }

    if (dto.name !== undefined) {
      const name = dto.name.trim();

      const existing = await this.prisma.finish.findFirst({
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
          'Já existe um tipo de acabamento com esse nome.',
        );
      }
    }

    return this.prisma.finish.update({
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

    const finish = await this.prisma.finish.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
    });

    if (!finish) {
      throw new NotFoundException(
        'Tipo de acabamento não encontrado.',
      );
    }

    return this.prisma.finish.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}