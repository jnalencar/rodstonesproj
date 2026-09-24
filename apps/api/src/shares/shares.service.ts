import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { randomUUID } from 'crypto';

import {
  Prisma,
  ShareStatus,
} from '../../generated/prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { CreateShareDto } from './dto/create-share.dto';

import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { StorageService } from 'src/storage/storage.service';

@Injectable()
export class SharesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) { }

  async create(
    dto: CreateShareDto,
    user: AuthenticatedUser,
  ) {
    const companyId = this.getCompanyId(user);

    const bundleIds = [...new Set(dto.bundleIds)];

    if (bundleIds.length === 0) {
      throw new ConflictException(
        'Informe pelo menos um bundle.',
      );
    }

    const bundles = await this.prisma.bundle.findMany({
      where: {
        id: {
          in: bundleIds,
        },
        companyId,
        deletedAt: null,
        status: {
          not: 'INACTIVE',
        },
      },
      select: {
        id: true,
      },
    });

    const foundIds = new Set(
      bundles.map((bundle) => bundle.id),
    );

    const invalidBundleIds = bundleIds.filter(
      (id) => !foundIds.has(id),
    );

    if (invalidBundleIds.length > 0) {
      throw new NotFoundException(
        `Bundles não encontrados: ${invalidBundleIds.join(', ')}`,
      );
    }

    const expiresAt = dto.expiresAt
      ? new Date(dto.expiresAt)
      : null;

    if (
      expiresAt &&
      expiresAt.getTime() <= Date.now()
    ) {
      throw new ConflictException(
        'A data de expiração deve estar no futuro.',
      );
    }

    const share = await this.prisma.share.create({
      data: {
        companyId,
        createdById: user.userId,

        token: randomUUID(),

        title: dto.title,
        expiresAt: dto.expiresAt
      ? new Date(dto.expiresAt)
      : null,

        customerName: dto.customerName,
        customerEmail: dto.customerEmail,
        customerPhone: dto.customerPhone,

        status: ShareStatus.ACTIVE,

        items: {
          create: bundleIds.map((bundleId) => ({
            bundleId,
          })),
        },
      },

      include: {
        items: {
          include: {
            bundle: {
              select: {
                id: true,
                bundleCode: true,
              },
            },
          },
        },
      },
    });

    return this.serializeShare(share);
  }

  async findAll(user: AuthenticatedUser) {
    const companyId = this.getCompanyId(user);

    const shares = await this.prisma.share.findMany({
      where: {
        companyId,
        deletedAt: null,
      },

      orderBy: {
        createdAt: 'desc',
      },

      include: {
        items: {
          select: {
            id: true,
            bundleId: true,
            bundle: {
              select: {
                id: true,
                bundleCode: true,
              },
            },
          },
        },
      },
    });

    return shares.map((share) =>
      this.serializeShare(share),
    );
  }

  async findPublicByToken(token: string) {
    const share = await this.prisma.share.findFirst({
      where: {
        token,
        deletedAt: null,
        status: ShareStatus.ACTIVE,
      },

      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },

        items: {
          orderBy: {
            id: 'asc',
          },

          include: {
            bundle: {
              include: {
                material: true,
                materialType: true,
                materialClassification: true,
                quality: true,
                finish: true,

                images: {
                  orderBy: [
                    {
                      isPrimary: 'desc',
                    },
                    {
                      createdAt: 'asc',
                    },
                  ],
                },

                slabs: {
                  where: {
                    deletedAt: null,
                  },

                  orderBy: {
                    number: 'asc',
                  },

                  include: {
                    images: {
                      orderBy: {
                        createdAt: 'asc',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!share) {
      throw new NotFoundException(
        'Catálogo não encontrado.',
      );
    }

    if (
      share.expiresAt &&
      share.expiresAt.getTime() <= Date.now()
    ) {
      throw new NotFoundException(
        'Catálogo expirado.',
      );
    }

    return {
      id: share.id,
      title: share.title,
      expiresAt: share.expiresAt,

      company: share.company,

      bundles: await Promise.all(
        share.items
          .filter(
            (item) =>
              item.bundle.deletedAt === null &&
              item.bundle.status !== 'INACTIVE',
          )
          .map((item) =>
            this.serializePublicBundle(item.bundle),
          ),
      ),
    };
  }

  private serializeShare(share: any) {
    return {
      id: share.id,
      token: share.token,
      title: share.title,
      status: share.status,
      expiresAt: share.expiresAt,
      createdAt: share.createdAt,

      itemCount: share.items.length,

      items: share.items.map((item: any) => ({
        id: item.id,
        bundleId: item.bundleId,
        bundleCode: item.bundle?.bundleCode,
      })),
    };
  }

  private async serializePublicBundle(bundle: any) {
    const images = await Promise.all(
      bundle.images.map(async (image: any) => ({
        id: image.id,
        url: await this.storageService.getPresignedUrl(
          image.storageKey,
        ),
        originalName: image.originalName,
        mimeType: image.mimeType,
        isPrimary: image.isPrimary,
      })),
    );

    const slabs = await Promise.all(
      bundle.slabs.map(async (slab: any) => {
        const slabImages = await Promise.all(
          slab.images.map(async (image: any) => ({
            id: image.id,
            url: await this.storageService.getPresignedUrl(
              image.storageKey,
            ),
            originalName: image.originalName,
            mimeType: image.mimeType,
          })),
        );

        return {
          id: slab.id,
          number: slab.number,

          length: slab.length,
          height: slab.height,
          area: slab.area,

          status: slab.status,

          images: slabImages,
        };
      }),
    );

    return {
      id: bundle.id,
      bundleCode: bundle.bundleCode,
      block: bundle.block,
      location: bundle.location,

      thickness: bundle.thickness,
      weight: bundle.weight,
      basePrice: bundle.basePrice,

      material: bundle.material,
      materialType: bundle.materialType,
      materialClassification:
        bundle.materialClassification,
      quality: bundle.quality,
      finish: bundle.finish,

      images,
      slabs,
    };
  }

  private getCompanyId(
    user: AuthenticatedUser,
  ): number {
    if (!user.companyId) {
      throw new ConflictException(
        'Usuário não possui empresa ativa.',
      );
    }

    return user.companyId;
  }
}