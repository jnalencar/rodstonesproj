import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '../../generated/prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

import { CreateBundleDto } from './dto/create-bundle.dto';
import { UpdateBundleDto } from './dto/update-bundle.dto';
import { CreateSlabDto } from './slabs/dto/create-slab.dto';

import { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user.interface';

@Injectable()
export class BundlesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) { }

  async create(
    dto: CreateBundleDto,
    image: Express.Multer.File,
    user: AuthenticatedUser,
  ) {

    const companyId = this.getCompanyId(user);

    if (!image) {
      throw new BadRequestException(
        'A imagem do bundle é obrigatória.',
      );
    }

    if (!image.mimetype.startsWith('image/')) {
      throw new BadRequestException(
        'O arquivo enviado precisa ser uma imagem.',
      );
    }

    if (!dto.slabs?.length) {
      throw new BadRequestException(
        'O bundle precisa possuir pelo menos uma chapa.',
      );
    }

    await this.validateMaterial(
      dto.materialId,
      companyId,
    );

    await this.validateCompanyOrGlobal(
      'materialType',
      dto.materialTypeId,
      companyId,
    );

    await this.validateCompanyOrGlobal(
      'materialClassification',
      dto.materialClassificationId,
      companyId,
    );

    await this.validateCompanyOrGlobal(
      'quality',
      dto.qualityId,
      companyId,
    );

    await this.validateCompanyOrGlobal(
      'finish',
      dto.finishId,
      companyId,
    );

    const existingBundle = await this.prisma.bundle.findFirst({
      where: {
        companyId,
        bundleCode: dto.bundleCode,
        deletedAt: null,
      },
    });

    if (existingBundle) {
      throw new ConflictException(
        'Já existe um bundle com esse código nesta empresa.',
      );
    }

    let slabs: CreateSlabDto[];

    try {
      slabs =
        typeof dto.slabs === 'string'
          ? JSON.parse(dto.slabs)
          : dto.slabs;
    } catch {
      throw new BadRequestException(
        'O campo slabs deve conter um JSON válido.',
      );
    }

    if (!Array.isArray(slabs)) {
      throw new BadRequestException(
        'O campo slabs deve ser um array.',
      );
    }

    if (slabs.length === 0) {
      throw new BadRequestException(
        'O bundle precisa possuir pelo menos uma chapa.',
      );
    }
    this.validateSlabs(slabs);

    const createdBundle = await this.prisma.bundle.create({
      data: {
        companyId,
        materialId: dto.materialId,

        materialTypeId: dto.materialTypeId,
        materialClassificationId:
          dto.materialClassificationId,
        qualityId: dto.qualityId,
        finishId: dto.finishId,

        bundleCode: dto.bundleCode,
        block: dto.block,
        location: dto.location,

        thickness: dto.thickness
          ? new Prisma.Decimal(dto.thickness)
          : undefined,

        weight: dto.weight
          ? new Prisma.Decimal(dto.weight)
          : undefined,

        basePrice: dto.basePrice
          ? new Prisma.Decimal(dto.basePrice)
          : undefined,

        status: 'PENDING',
      },
    });

    const storageKey = this.buildBundleImageKey(
      createdBundle.id,
      image.originalname,
    );

    let uploaded = false;

    try {
      await this.storageService.upload(
        storageKey,
        image.buffer,
        image.mimetype,
      );

      uploaded = true;

      await this.prisma.$transaction(async (tx) => {
        await tx.bundleImage.create({
          data: {
            bundleId: createdBundle.id,

            storageKey,
            originalName: image.originalname,
            mimeType: image.mimetype,
            size: image.size,

            isPrimary: true,
          },
        });

        await tx.slab.createMany({
          data: slabs.map((slab) => ({
            bundleId: createdBundle.id,

            number: slab.number,

            length: new Prisma.Decimal(slab.length),
            height: new Prisma.Decimal(slab.height),

            area: this.calculateArea(
              slab.length,
              slab.height,
            ),

            status: 'AVAILABLE',
          })),
        });

        await tx.bundle.update({
          where: {
            id: createdBundle.id,
          },
          data: {
            status: 'AVAILABLE',
          },
        });
      });

      return this.findOne(
        createdBundle.id,
        user,
      );
    } catch (error) {
      if (uploaded) {
        try {
          await this.storageService.delete(storageKey);
        } catch {
          // Não sobrescreve o erro original.
        }
      }

      try {
        await this.prisma.bundle.delete({
          where: {
            id: createdBundle.id,
          },
        });
      } catch {
        // Não sobrescreve o erro original.
      }

      throw error;
    }
  }

  async findAll(user: AuthenticatedUser) {
    const companyId = this.getCompanyId(user);

    const bundles = await this.prisma.bundle.findMany({
      where: {
        companyId,
        deletedAt: null,
        status: {
          not: 'PENDING',
        },
      },

      include: {
        material: true,
        materialType: true,
        materialClassification: true,
        quality: true,
        finish: true,

        images: {
          orderBy: {
            isPrimary: 'desc',
          },
        },

        _count: {
          select: {
            slabs: true,
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });

    const availableSlabCounts = bundles.length > 0
      ? await this.prisma.slab.groupBy({
        by: ['bundleId'],
        where: {
          bundleId: {
            in: bundles.map((bundle) => bundle.id),
          },
          deletedAt: null,
          status: 'AVAILABLE',
        },
        _count: {
          _all: true,
        },
      })
      : [];

    const availableCountByBundleId = new Map(
      availableSlabCounts.map(({ bundleId, _count }) => [
        bundleId,
        _count._all,
      ]),
    );

    return Promise.all(
      bundles.map((bundle) => this.serializeBundle({
        ...bundle,
        availableSlabCount: availableCountByBundleId.get(bundle.id) ?? 0,
      })),
    );
  }

  async findOne(
    id: number,
    user: AuthenticatedUser,
  ) {
    const companyId = this.getCompanyId(user);

    const bundle = await this.prisma.bundle.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
        status: {
          not: 'PENDING',
        },
      },

      include: {
        material: true,
        materialType: true,
        materialClassification: true,
        quality: true,
        finish: true,

        images: {
          orderBy: {
            isPrimary: 'desc',
          },
        },

        slabs: {
          where: {
            deletedAt: null,
          },

          include: {
            images: true,
          },

          orderBy: {
            number: 'asc',
          },
        },
      },
    });

    if (!bundle) {
      throw new NotFoundException(
        'Bundle não encontrado.',
      );
    }

    return this.serializeBundle(bundle);
  }

  async update(
    id: number,
    dto: UpdateBundleDto,
    user: AuthenticatedUser,
  ) {
    const companyId = this.getCompanyId(user);

    const existingBundle = await this.prisma.bundle.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
    });

    if (!existingBundle) {
      throw new NotFoundException(
        'Bundle não encontrado.',
      );
    }

    if (dto.materialId !== undefined) {
      await this.validateMaterial(
        dto.materialId,
        companyId,
      );
    }

    if (dto.materialTypeId !== undefined) {
      await this.validateCompanyOrGlobal(
        'materialType',
        dto.materialTypeId,
        companyId,
      );
    }

    if (dto.materialClassificationId !== undefined) {
      await this.validateCompanyOrGlobal(
        'materialClassification',
        dto.materialClassificationId,
        companyId,
      );
    }

    if (dto.qualityId !== undefined) {
      await this.validateCompanyOrGlobal(
        'quality',
        dto.qualityId,
        companyId,
      );
    }

    if (dto.finishId !== undefined) {
      await this.validateCompanyOrGlobal(
        'finish',
        dto.finishId,
        companyId,
      );
    }

    if (
      dto.bundleCode !== undefined &&
      dto.bundleCode !== existingBundle.bundleCode
    ) {
      const duplicatedBundle =
        await this.prisma.bundle.findFirst({
          where: {
            companyId,
            bundleCode: dto.bundleCode,
            deletedAt: null,
            NOT: {
              id,
            },
          },
        });

      if (duplicatedBundle) {
        throw new ConflictException(
          'Já existe um bundle com esse código.',
        );
      }
    }

    const updatedBundle =
      await this.prisma.bundle.update({
        where: {
          id,
        },
        data: {
          ...(dto.materialId !== undefined && {
            materialId: dto.materialId,
          }),

          ...(dto.materialTypeId !== undefined && {
            materialTypeId: dto.materialTypeId,
          }),

          ...(dto.materialClassificationId !== undefined && {
            materialClassificationId:
              dto.materialClassificationId,
          }),

          ...(dto.qualityId !== undefined && {
            qualityId: dto.qualityId,
          }),

          ...(dto.finishId !== undefined && {
            finishId: dto.finishId,
          }),

          ...(dto.bundleCode !== undefined && {
            bundleCode: dto.bundleCode,
          }),

          ...(dto.block !== undefined && {
            block: dto.block,
          }),

          ...(dto.location !== undefined && {
            location: dto.location,
          }),

          ...(dto.thickness !== undefined && {
            thickness: dto.thickness,
          }),

          ...(dto.weight !== undefined && {
            weight: dto.weight,
          }),

          ...(dto.basePrice !== undefined && {
            basePrice: dto.basePrice,
          }),
        },
      });

    return this.findOne(updatedBundle.id, user);
  }

  async remove(
    id: number,
    user: AuthenticatedUser,
  ) {
    const companyId = this.getCompanyId(user);

    const bundle = await this.prisma.bundle.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
    });

    if (!bundle) {
      throw new NotFoundException(
        'Bundle não encontrado.',
      );
    }

    await this.prisma.bundle.update({
      where: {
        id,
      },

      data: {
        status: 'INACTIVE',
        deletedAt: new Date(),
      },
    });

    return {
      message: 'Bundle removido com sucesso.',
    };
  }

  // --------------------------------------------------
  // Helpers
  // --------------------------------------------------

  private getCompanyId(
    user: AuthenticatedUser,
  ): number {
    if (!user.companyId) {
      throw new BadRequestException(
        'Usuário não possui uma empresa selecionada.',
      );
    }

    return user.companyId;
  }

  private async validateMaterial(
    materialId: number,
    companyId: number,
  ) {
    const material =
      await this.prisma.material.findFirst({
        where: {
          id: materialId,
          companyId,
          deletedAt: null,
          status: 'ACTIVE',
        },
      });

    if (!material) {
      throw new BadRequestException(
        'Material inválido ou não pertence à empresa.',
      );
    }

    return material;
  }

  private async validateCompanyOrGlobal(
    model:
      | 'materialType'
      | 'materialClassification'
      | 'quality'
      | 'finish',
    id: number,
    companyId: number,
  ) {
    const prismaModel = (this.prisma as any)[model];

    const record = await prismaModel.findFirst({
      where: {
        id,
        deletedAt: null,

        OR: [
          {
            companyId: null,
          },
        ],
      },
    });

    if (!record) {
      throw new BadRequestException(
        `${model} inválido ou não disponível para esta empresa.`,
      );
    }

    return record;
  }

  private validateSlabs(
    slabs: CreateSlabDto[],
  ) {
    const numbers = new Set<number>();

    for (const slab of slabs) {
      if (
        slab.number === undefined ||
        slab.length === undefined ||
        slab.height === undefined
      ) {
        throw new BadRequestException(
          'Cada chapa deve possuir number, length e height.',
        );
      }

      if (numbers.has(slab.number)) {
        throw new BadRequestException(
          `A chapa ${slab.number} foi informada mais de uma vez.`,
        );
      }

      numbers.add(slab.number);

      const length = new Prisma.Decimal(
        slab.length,
      );

      const height = new Prisma.Decimal(
        slab.height,
      );

      if (length.lte(0)) {
        throw new BadRequestException(
          `O comprimento da chapa ${slab.number} deve ser maior que zero.`,
        );
      }

      if (height.lte(0)) {
        throw new BadRequestException(
          `A altura da chapa ${slab.number} deve ser maior que zero.`,
        );
      }
    }
  }

  private calculateArea(
    length: string,
    height: string,
  ): Prisma.Decimal {
    return new Prisma.Decimal(length)
      .mul(new Prisma.Decimal(height))
      .toDecimalPlaces(3);
  }

  private buildBundleImageKey(
    bundleId: number,
    originalName: string,
  ): string {
    const extension =
      originalName.includes('.')
        ? originalName
          .split('.')
          .pop()
          ?.toLowerCase()
        : 'jpg';

    return `bundles/${bundleId}/main.${extension}`;
  }

  private async serializeBundle(
    bundle: any,
  ) {
    const images = await Promise.all(
      bundle.images.map(async (image: any) => ({
        ...image,

        url: await this.storageService.getPresignedUrl(
          image.storageKey,
        ),
      })),
    );

    const slabs = bundle.slabs
      ? await Promise.all(
        bundle.slabs.map(async (slab: any) => ({
          ...slab,

          images: await Promise.all(
            slab.images.map(async (image: any) => ({
              ...image,

              url:
                await this.storageService.getPresignedUrl(
                  image.storageKey,
                ),
            })),
          ),
        })),
      )
      : undefined;

    return {
      ...bundle,
      images,

      ...(slabs
        ? {
          slabs,
        }
        : {}),
    };
  }
}