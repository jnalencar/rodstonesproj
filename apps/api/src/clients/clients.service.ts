
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    dto: CreateClientDto,
    user: AuthenticatedUser,
  ) {
    const companyId = this.getCompanyId(user);

    const client = await this.prisma.client.create({
      data: {
        companyId,
        name: dto.name.trim(),
        email: dto.email?.trim() || null,
        phone: dto.phone?.trim() || null,
        document: dto.document?.trim() || null,
        notes: dto.notes?.trim() || null,
      },
    });

    return this.serializeClient(client);
  }

  async findAll(user: AuthenticatedUser) {
    const companyId = this.getCompanyId(user);

    const clients = await this.prisma.client.findMany({
      where: {
        companyId,
        deletedAt: null,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return clients.map((client) =>
      this.serializeClient(client),
    );
  }

  async findOne(
    id: number,
    user: AuthenticatedUser,
  ) {
    const companyId = this.getCompanyId(user);

    const client = await this.prisma.client.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
    });

    if (!client) {
      throw new NotFoundException(
        'Cliente não encontrado.',
      );
    }

    return this.serializeClient(client);
  }

  async update(
    id: number,
    dto: UpdateClientDto,
    user: AuthenticatedUser,
  ) {
    const companyId = this.getCompanyId(user);

    const existingClient =
      await this.prisma.client.findFirst({
        where: {
          id,
          companyId,
          deletedAt: null,
        },
        select: {
          id: true,
        },
      });

    if (!existingClient) {
      throw new NotFoundException(
        'Cliente não encontrado.',
      );
    }

    const client = await this.prisma.client.update({
      where: {
        id: existingClient.id,
      },
      data: {
        ...(dto.name !== undefined && {
          name: dto.name.trim(),
        }),

        ...(dto.email !== undefined && {
          email: dto.email.trim() || null,
        }),

        ...(dto.phone !== undefined && {
          phone: dto.phone.trim() || null,
        }),

        ...(dto.document !== undefined && {
          document: dto.document.trim() || null,
        }),

        ...(dto.notes !== undefined && {
          notes: dto.notes.trim() || null,
        }),
      },
    });

    return this.serializeClient(client);
  }

  async remove(
    id: number,
    user: AuthenticatedUser,
  ) {
    const companyId = this.getCompanyId(user);

    const client = await this.prisma.client.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!client) {
      throw new NotFoundException(
        'Cliente não encontrado.',
      );
    }

    const sharesCount = await this.prisma.share.count({
      where: {
        clientId: id,
        companyId,
        deletedAt: null,
      },
    });

    if (sharesCount > 0) {
      throw new ConflictException(
        'Não é possível excluir um cliente que possui catálogos vinculados.',
      );
    }

    await this.prisma.client.update({
      where: {
        id: client.id,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    return {
      message: 'Cliente excluído com sucesso.',
    };
  }

  private serializeClient(client: any) {
    return {
      id: client.id,
      companyId: client.companyId,
      name: client.name,
      email: client.email,
      phone: client.phone,
      document: client.document,
      notes: client.notes,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
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