import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';

import { CreateSlabDto } from './dto/create-slab.dto';

@Injectable()
export class SlabsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    bundleId: number,
    dto: CreateSlabDto,
    user: AuthenticatedUser,
  ) {
    const companyId = this.getCompanyId(user);

    // 1. Validar o Bundle
    const bundle = await this.prisma.bundle.findFirst({
      where: {
        id: bundleId,
        companyId,
        deletedAt: null,
        status: 'AVAILABLE',
      },
    });

    if (!bundle) {
      throw new NotFoundException(
        'Bundle não encontrado ou não está disponível.',
      );
    }

    // 2. Validar dimensões
    const length = Number(dto.length);
    const height = Number(dto.height);

    if (
      !Number.isFinite(length) ||
      !Number.isFinite(height) ||
      length <= 0 ||
      height <= 0
    ) {
      throw new BadRequestException(
        'Comprimento e altura devem ser maiores que zero.',
      );
    }

    // 3. Verificar número duplicado
    const existingSlab =
      await this.prisma.slab.findFirst({
        where: {
          bundleId,
          number: dto.number,
          deletedAt: null,
        },
      });

    if (existingSlab) {
      throw new ConflictException(
        'Já existe uma chapa com esse número neste Bundle.',
      );
    }

    // 4. Calcular área
    const area = length * height;

    const roundedArea = Number(
      area.toFixed(3),
    );

    // 5. Criar chapa
    const slab = await this.prisma.slab.create({
      data: {
        bundleId,
        number: dto.number,
        length: dto.length,
        height: dto.height,
        area: roundedArea,
        status: 'AVAILABLE',
      },
    });

    return slab;
  }

  private getCompanyId(
    user: AuthenticatedUser,
  ): number {
    if (!user.companyId) {
      throw new BadRequestException(
        'Usuário não está vinculado a uma empresa.',
      );
    }

    return user.companyId;
  }
}