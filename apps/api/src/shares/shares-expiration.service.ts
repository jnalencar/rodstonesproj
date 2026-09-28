import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ShareExpirationService {
  private readonly logger = new Logger(
    ShareExpirationService.name,
  );

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async expireShares() {
    const result = await this.prisma.share.updateMany({
      where: {
        status: 'ACTIVE',
        expiresAt: {
          not: null,
          lte: new Date(),
        },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    if (result.count > 0) {
      this.logger.log(
        `${result.count} share(s) expiradas.`,
      );
    }
  }
}