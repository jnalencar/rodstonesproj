import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user.interface';

@Injectable()
export class RolesService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(user: AuthenticatedUser) {
        return this.prisma.role.findMany({
            where: {
                OR: [
                    {
                        isSystem: true,
                    },
                    {   
                        isSystem: false,
                        companyId: user.companyId,
                    },
                ],
            },
            orderBy: {
                name: 'asc',
            },
            include: {
                permissions: {
                    select: {
                        permission: {
                            select: {
                                id: true,
                                code: true,
                                description: true,
                            },
                        },
                    },
                },
            },
        });
    }

    async findOne(id: number, user: AuthenticatedUser) {
        const role = await this.prisma.role.findUnique({
            where: {
                id,
                OR: [
                    {
                        isSystem: true,
                    },
                    {
                        companyId: user.companyId,
                    },
                ],
            },
            include: {
                permissions: {
                    select: {
                        permission: {
                            select: {
                                id: true,
                                code: true,
                                description: true,
                            },
                        },
                    },
                },
            },
        });

        if (!role) {
            throw new NotFoundException('Role não encontrada');
        }

        return role;
    }

    async create(
        dto: CreateRoleDto,
        user: AuthenticatedUser,
    ) {

        if (!user.companyId) {
            throw new NotFoundException(
                'Usuário não possui uma empresa selecionada',
            );
        }
        const existingRole = await this.prisma.role.findFirst({
            where: {
                OR: [
                    { code: dto.code },
                    { name: dto.name },
                ],
            },
        });

        if (existingRole) {
            throw new ConflictException(
                'Já existe uma role com este nome ou código',
            );
        }

        const permissionCodes = dto.permissions ?? [];

        const permissions = await this.prisma.permission.findMany({
            where: {
                code: {
                    in: permissionCodes,
                },
            },
            select: {
                id: true,
                code: true,
            },
        });

        if (permissions.length !== permissionCodes.length) {
            throw new NotFoundException(
                'Uma ou mais permissões não foram encontradas',
            );
        }

        return this.prisma.role.create({
            data: {
                name: dto.name,
                code: dto.code,
                description: dto.description,
                companyId: user.companyId,
                permissions: {
                    create: permissions.map((permission) => ({
                        permissionId: permission.id,
                    })),
                },
            },
            include: {
                permissions: {
                    select: {
                        permission: {
                            select: {
                                id: true,
                                code: true,
                                description: true,
                            },
                        },
                    },
                },
            },
        });
    }

    async update(id: number, dto: UpdateRoleDto, user: AuthenticatedUser) {
        const role = await this.prisma.role.findFirst({
            where: {
                id,
                isSystem: false,
                companyId: user.companyId,
            },
        });

        if (!role) {
            throw new NotFoundException('Role não encontrada');
        }

        if (role.isSystem) {
            throw new ConflictException(
                'Roles do sistema não podem ser alteradas',
            );
        }

        if (dto.permissions !== undefined) {
            const permissions = await this.prisma.permission.findMany({
                where: {
                    code: {
                        in: dto.permissions,
                    },
                },
                select: {
                    id: true,
                    code: true,
                },
            });

            if (permissions.length !== dto.permissions.length) {
                throw new NotFoundException(
                    'Uma ou mais permissões não foram encontradas',
                );
            }

            await this.prisma.rolePermission.deleteMany({
                where: {
                    roleId: id,
                },
            });

            await this.prisma.rolePermission.createMany({
                data: permissions.map((permission) => ({
                    roleId: id,
                    permissionId: permission.id,
                })),
            });
        }

        return this.prisma.role.update({
            where: { id },
            data: {
                name: dto.name,
                description: dto.description,
            },
            include: {
                permissions: {
                    select: {
                        permission: {
                            select: {
                                id: true,
                                code: true,
                                description: true,
                            },
                        },
                    },
                },
            },
        });
    }
}