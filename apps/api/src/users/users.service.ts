import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    async findAll(user: AuthenticatedUser) {
        if (!user.companyId) {
            throw new NotFoundException(
                'Usuário não possui uma empresa selecionada',
            );
        }

        return this.prisma.user.findMany({
            where: {
                deletedAt: null,
                memberships: {
                    some: {
                        companyId: user.companyId,
                        status: 'ACTIVE',
                        deletedAt: null,
                    },
                },
            },
            select: {
                id: true,
                name: true,
                email: true,
                status: true,
                createdAt: true,
                lastLoginAt: true,
                memberships: {
                    where: {
                        companyId: user.companyId,
                        status: 'ACTIVE',
                        deletedAt: null,
                    },
                    select: {
                        id: true,
                        status: true,
                        roles: {
                            select: {
                                role: {
                                    select: {
                                        id: true,
                                        code: true,
                                        name: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: {
                name: 'asc',
            },
        });
    }

    async findOne(id: number, user: AuthenticatedUser) {

        const isPlatformAdmin = user.roles.includes('PLATFORM_ADMIN');

        const targetUser = await this.prisma.user.findFirst({
            where: {
                id,
                deletedAt: null,
                ...(isPlatformAdmin
                    ? {}
                    : {
                        memberships: {
                            some: {
                                companyId: user.companyId ?? -1,
                                status: 'ACTIVE',
                                deletedAt: null,
                            },
                        },
                    }),
            },
            select: {
                id: true,
                name: true,
                email: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                lastLoginAt: true,
                memberships: {
                    where: {
                        status: 'ACTIVE',
                        deletedAt: null,
                    },
                    select: {
                        id: true,
                        status: true,
                        company: {
                            select: {
                                id: true,
                                name: true,
                                status: true,
                            },
                        },
                        roles: {
                            select: {
                                role: {
                                    select: {
                                        code: true,
                                        name: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!targetUser) {
            throw new NotFoundException('Usuário não encontrado');
        }

        return targetUser;
    }

    async update(
        id: number,
        dto: UpdateUserDto,
        user: AuthenticatedUser,
    ) {
        const isPlatformAdmin = user.roles.includes('PLATFORM_ADMIN');

        const targetUser = await this.prisma.user.findFirst({
            where: {
                id,
                deletedAt: null,
                ...(isPlatformAdmin
                    ? {}
                    : {
                        memberships: {
                            some: {
                                companyId: user.companyId ?? -1,
                                status: 'ACTIVE',
                                deletedAt: null,
                            },
                        },
                    }),
            },
            select: {
                id: true,
                email: true,
            },
        });

        if (!targetUser) {
            throw new NotFoundException('Usuário não encontrado');
        }

        if (
            dto.email &&
            dto.email !== targetUser.email
        ) {
            const emailAlreadyExists = await this.prisma.user.findFirst({
                where: {
                    email: dto.email,
                    id: {
                        not: id,
                    },
                },
                select: {
                    id: true,
                },
            });

            if (emailAlreadyExists) {
                throw new ConflictException(
                    'E-mail já cadastrado',
                );
            }
        }

        return this.prisma.user.update({
            where: {
                id,
            },
            data: {
                ...(dto.name !== undefined && {
                    name: dto.name,
                }),
                ...(dto.email !== undefined && {
                    email: dto.email,
                }),
                ...(dto.status !== undefined && {
                    status: dto.status,
                }),
            },
            select: {
                id: true,
                name: true,
                email: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                lastLoginAt: true,
            },
        });
    }

    async remove(
        id: number,
        user: AuthenticatedUser,
    ) {
        const isPlatformAdmin = user.roles.includes('PLATFORM_ADMIN');

        if (id === user.userId) {
            throw new ConflictException(
                'Você não pode remover o próprio usuário',
            );
        }

        const targetUser = await this.prisma.user.findFirst({
            where: {
                id,
                deletedAt: null,
                ...(isPlatformAdmin
                    ? {}
                    : {
                        memberships: {
                            some: {
                                companyId: user.companyId ?? -1,
                                status: 'ACTIVE',
                                deletedAt: null,
                            },
                        },
                    }),
            },
            select: {
                id: true,
            },
        });

        if (!targetUser) {
            throw new NotFoundException(
                'Usuário não encontrado',
            );
        }

        await this.prisma.user.update({
            where: {
                id,
            },
            data: {
                status: 'INACTIVE',
                deletedAt: new Date(),
            },
        });

        return {
            message: 'Usuário removido com sucesso',
        };
    }
}