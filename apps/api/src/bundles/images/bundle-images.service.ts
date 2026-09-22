import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { randomUUID } from 'crypto';

import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';

import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';

@Injectable()
export class BundleImagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  private getCompanyId(user: AuthenticatedUser): number {
    if (!user.companyId) {
      throw new BadRequestException(
        'O usuário não possui uma empresa selecionada.',
      );
    }

    return user.companyId;
  }

  private buildStorageKey(
    bundleId: number,
    originalName: string,
  ): string {
    const extension = originalName.includes('.')
      ? originalName.substring(originalName.lastIndexOf('.'))
      : '';

    return `bundles/${bundleId}/${randomUUID()}${extension}`;
  }

  private async validateBundle(
    bundleId: number,
    companyId: number,
  ) {
    const bundle = await this.prisma.bundle.findFirst({
      where: {
        id: bundleId,
        companyId,
        deletedAt: null,
      },
    });

    if (!bundle) {
      throw new NotFoundException(
        'Bundle não encontrado.',
      );
    }

    return bundle;
  }

  async upload(
    bundleId: number,
    file: Express.Multer.File,
    user: AuthenticatedUser,
  ) {
    const companyId = this.getCompanyId(user);

    if (!file) {
      throw new BadRequestException(
        'A imagem é obrigatória.',
      );
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException(
        'O arquivo enviado precisa ser uma imagem.',
      );
    }

    await this.validateBundle(bundleId, companyId);

    const storageKey = this.buildStorageKey(
      bundleId,
      file.originalname,
    );

    let uploaded = false;

    try {
      await this.storageService.upload(
        storageKey,
        file.buffer,
        file.mimetype,
      );

      uploaded = true;

      const image = await this.prisma.bundleImage.create({
        data: {
          bundleId,
          storageKey,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          isPrimary: false,
        },
      });

      const url =
        await this.storageService.getPresignedUrl(
          image.storageKey,
        );

      return {
        id: image.id,
        bundleId: image.bundleId,
        originalName: image.originalName,
        mimeType: image.mimeType,
        size: image.size,
        isPrimary: image.isPrimary,
        createdAt: image.createdAt,
        url,
      };
    } catch (error) {
      if (uploaded) {
        try {
          await this.storageService.delete(storageKey);
        } catch {
          // Mantém o erro original.
        }
      }

      throw error;
    }
  }

  async findAll(
    bundleId: number,
    user: AuthenticatedUser,
  ) {
    const companyId = this.getCompanyId(user);

    await this.validateBundle(bundleId, companyId);

    const images = await this.prisma.bundleImage.findMany({
      where: {
        bundleId,
      },
      orderBy: [
        {
          isPrimary: 'desc',
        },
        {
          createdAt: 'asc',
        },
      ],
    });

    return Promise.all(
      images.map(async (image) => ({
        id: image.id,
        bundleId: image.bundleId,
        originalName: image.originalName,
        mimeType: image.mimeType,
        size: image.size,
        isPrimary: image.isPrimary,
        createdAt: image.createdAt,
        url: await this.storageService.getPresignedUrl(
          image.storageKey,
        ),
      })),
    );
  }

  async remove(
    bundleId: number,
    imageId: number,
    user: AuthenticatedUser,
  ) {
    const companyId = this.getCompanyId(user);

    await this.validateBundle(bundleId, companyId);

    const image = await this.prisma.bundleImage.findFirst({
      where: {
        id: imageId,
        bundleId,
      },
    });

    if (!image) {
      throw new NotFoundException(
        'Imagem não encontrada neste bundle.',
      );
    }

    if (image.isPrimary) {
      throw new ConflictException(
        'A imagem principal não pode ser excluída.',
      );
    }

    await this.storageService.delete(
      image.storageKey,
    );

    await this.prisma.bundleImage.delete({
      where: {
        id: image.id,
      },
    });

    return {
      message: 'Imagem removida com sucesso.',
    };
  }
}