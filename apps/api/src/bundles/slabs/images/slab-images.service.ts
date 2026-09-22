import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';

import { PrismaService } from '../../../prisma/prisma.service';
import { StorageService } from '../../../storage/storage.service';

import { AuthenticatedUser } from '../../../auth/interfaces/authenticated-user.interface';

@Injectable()
export class SlabImagesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly storageService: StorageService,
    ) { }

    async upload(
        bundleId: number,
        slabId: number,
        file: Express.Multer.File,
        user: AuthenticatedUser,
    ) {
        const companyId = this.getCompanyId(user);

        if (!file) {
            throw new BadRequestException(
                'A imagem é obrigatória.',
            );
        }

        const slab = await this.prisma.slab.findFirst({
            where: {
                id: slabId,
                bundleId,
                deletedAt: null,
                bundle: {
                    companyId,
                    deletedAt: null,
                },
            },
        });

        if (!slab) {
            throw new NotFoundException(
                'Chapa não encontrada.',
            );
        }

        const storageKey = [
            'slabs',
            slabId,
            `${randomUUID()}-${file.originalname}`,
        ].join('/');

        await this.storageService.upload(
            storageKey,
            file.buffer,
            file.mimetype,
        );

        try {
            const image = await this.prisma.slabImage.create({
                data: {
                    slabId,
                    storageKey,
                    originalName: file.originalname,
                    mimeType: file.mimetype,
                    size: file.size,
                },
            });

            const url = await this.storageService.getPresignedUrl(
                image.storageKey,
            );

            return {
                ...image,
                url,
            };
        } catch (error) {
            await this.storageService.delete(storageKey);
            throw error;
        }
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

    async remove(
        bundleId: number,
        slabId: number,
        imageId: number,
        user: AuthenticatedUser,
    ) {
        const companyId = this.getCompanyId(user);

        const image = await this.prisma.slabImage.findFirst({
            where: {
                id: imageId,
                slabId,
                slab: {
                    id: slabId,
                    deletedAt: null,
                    bundle: {
                        id: bundleId,
                        companyId,
                        deletedAt: null,
                    },
                },
            },
        });

        if (!image) {
            throw new NotFoundException(
                'Imagem não encontrada.',
            );
        }

        await this.storageService.delete(image.storageKey);

        await this.prisma.slabImage.delete({
            where: {
                id: imageId,
            },
        });

        return {
            message: 'Imagem removida com sucesso.',
        };
    }

    async findAll(
        bundleId: number,
        slabId: number,
        user: AuthenticatedUser,
    ) {
        const companyId = this.getCompanyId(user);

        const slab = await this.prisma.slab.findFirst({
            where: {
                id: slabId,
                bundleId,
                deletedAt: null,
                bundle: {
                    companyId,
                    deletedAt: null,
                },
            },
        });

        if (!slab) {
            throw new NotFoundException(
                'Chapa não encontrada.',
            );
        }

        const images = await this.prisma.slabImage.findMany({
            where: {
                slabId,
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

        return Promise.all(
            images.map(async (image) => {
                const url = await this.storageService.getPresignedUrl(
                    image.storageKey,
                );

                return {
                    id: image.id,
                    slabId: image.slabId,
                    originalName: image.originalName,
                    mimeType: image.mimeType,
                    size: image.size,
                    createdAt: image.createdAt,
                    updatedAt: image.updatedAt,
                    url,
                };
            }),
        );
    }
}