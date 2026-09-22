import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { StorageService } from '../../storage/storage.service';

import { CreateSlabDto } from './dto/create-slab.dto';
import { UpdateSlabDto } from './dto/update-slab.dto';

@Injectable()
export class SlabsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) { }

  async create(
    bundleId: number,
    dto: CreateSlabDto,
    user: AuthenticatedUser,
  ) {
    const companyId = this.getCompanyId(user);

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

    const area = length * height;

    const roundedArea = Number(
      area.toFixed(3),
    );

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

  async findAll(
    bundleId: number,
    user: AuthenticatedUser,
  ) {
    const companyId = this.getCompanyId(user);

    const bundle = await this.prisma.bundle.findFirst({
      where: {
        id: bundleId,
        companyId,
        deletedAt: null,
        status: {
          not: 'INACTIVE',
        },
      },
    });

    if (!bundle) {
      throw new NotFoundException(
        'Bundle não encontrado ou está inativo.',
      );
    }

    const slabs = await this.prisma.slab.findMany({
      where: {
        bundleId,
        deletedAt: null,
      },
      orderBy: {
        number: 'asc',
      },
      include: {
        images: true,
      },
    });

    return Promise.all(
      slabs.map(async (slab) => ({
        ...slab,
        images: await this.serializeSlabImages(slab.images),
      })),
    );
  }

  async findOne(
    bundleId: number,
    slabId: number,
    user: AuthenticatedUser,
  ) {
    const companyId = this.getCompanyId(user);

    const bundle = await this.prisma.bundle.findFirst({
      where: {
        id: bundleId,
        companyId,
        deletedAt: null,
        status: {
          not: 'INACTIVE',
        },
      },
    });

    if (!bundle) {
      throw new NotFoundException(
        'Bundle não encontrado ou está inativo.',
      );
    }

    const slab = await this.prisma.slab.findFirst({
      where: {
        id: slabId,
        bundleId,
        deletedAt: null,
      },
      include: {
        images: true,
      },
    });

    if (!slab) {
      throw new NotFoundException(
        'Chapa não encontrada.',
      );
    }

    return {
      ...slab,
      images: await this.serializeSlabImages(slab.images),
    };
  }

  async update(
    bundleId: number,
    slabId: number,
    dto: UpdateSlabDto,
    user: AuthenticatedUser,
  ) {
    const companyId = this.getCompanyId(user);

    const bundle = await this.prisma.bundle.findFirst({
      where: {
        id: bundleId,
        companyId,
        deletedAt: null,
        status: {
          not: 'INACTIVE',
        },
      },
    });

    if (!bundle) {
      throw new NotFoundException(
        'Bundle não encontrado ou está inativo.',
      );
    }

    const slab = await this.prisma.slab.findFirst({
      where: {
        id: slabId,
        bundleId,
        deletedAt: null,
      },
    });

    if (!slab) {
      throw new NotFoundException('Chapa não encontrada.');
    }

    if (dto.number !== undefined) {
      const existingSlab = await this.prisma.slab.findFirst({
        where: {
          bundleId,
          number: dto.number,
          deletedAt: null,
          id: {
            not: slabId,
          },
        },
      });

      if (existingSlab) {
        throw new ConflictException(
          'Já existe uma chapa com esse número neste Bundle.',
        );
      }
    }

    const length = dto.length !== undefined
      ? Number(dto.length)
      : Number(slab.length);

    const height = dto.height !== undefined
      ? Number(dto.height)
      : Number(slab.height);

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

    const area = Number((length * height).toFixed(3));

    const updatedSlab = await this.prisma.slab.update({
      where: {
        id: slabId,
      },
      data: {
        ...(dto.number !== undefined && {
          number: dto.number,
        }),

        ...(dto.length !== undefined && {
          length: dto.length,
        }),

        ...(dto.height !== undefined && {
          height: dto.height,
        }),

        area,
      },
    });

    return updatedSlab;
  }

  async remove(
    bundleId: number,
    slabId: number,
    user: AuthenticatedUser,
  ) {
    const companyId = this.getCompanyId(user);

    const bundle = await this.prisma.bundle.findFirst({
      where: {
        id: bundleId,
        companyId,
        deletedAt: null,
      },
    });

    if (!bundle) {
      throw new NotFoundException('Bundle não encontrado.');
    }

    const slab = await this.prisma.slab.findFirst({
      where: {
        id: slabId,
        bundleId,
        deletedAt: null,
      },
    });

    if (!slab) {
      throw new NotFoundException('Chapa não encontrada.');
    }

    await this.prisma.slab.update({
      where: {
        id: slabId,
      },
      data: {
        status: 'INACTIVE',
        deletedAt: new Date(),
      },
    });

    return {
      message: 'Chapa removida com sucesso.',
    };
  }

  private async serializeSlabImages(images: any[]) {
    return Promise.all(
      images.map(async (image) => {
        const url = await this.storageService.getPresignedUrl(
          image.storageKey,
        );

        return {
          ...image,
          url,
        };
      }),
    );
  }
}