import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Scheduled cleanup service for soft-deleted rows.
 *
 * Rows with `deletedAt` older than DATA_RETENTION_DAYS are permanently removed.
 * The job runs once on startup and then on the interval defined by
 * DATA_RETENTION_INTERVAL_MS (default: 24 h).
 *
 * Environment variables
 * ---------------------
 * DATA_RETENTION_DAYS          – retention window in days (default: 90)
 * DATA_RETENTION_INTERVAL_MS   – cleanup interval in ms   (default: 86400000 = 24 h)
 */
@Injectable()
export class DataRetentionService implements OnModuleInit {
  private readonly logger = new Logger(DataRetentionService.name);
  private readonly retentionDays: number;
  private readonly intervalMs: number;

  constructor(private readonly prisma: PrismaClient) {
    this.retentionDays = parseInt(process.env.DATA_RETENTION_DAYS ?? '90', 10);
    this.intervalMs = parseInt(process.env.DATA_RETENTION_INTERVAL_MS ?? String(24 * 60 * 60 * 1000), 10);
  }

  onModuleInit(): void {
    // Run immediately, then on a recurring interval
    this.runCleanup();
    setInterval(() => this.runCleanup(), this.intervalMs);
  }

  /** Permanently deletes rows soft-deleted more than retentionDays ago. */
  async runCleanup(): Promise<void> {
    const cutoff = new Date(Date.now() - this.retentionDays * 24 * 60 * 60 * 1000);
    this.logger.log(`Running retention cleanup: permanently removing rows deleted before ${cutoff.toISOString()}`);

    try {
      // Delete in dependency order (votes → claims → policies)
      const votes = await this.prisma.vote.deleteMany({
        where: { deletedAt: { not: null, lt: cutoff } },
      });
      const claims = await this.prisma.claim.deleteMany({
        where: { deletedAt: { not: null, lt: cutoff } },
      });
      const policies = await this.prisma.policy.deleteMany({
        where: { deletedAt: { not: null, lt: cutoff } },
      });

      this.logger.log(
        `Cleanup complete: removed ${votes.count} votes, ${claims.count} claims, ${policies.count} policies`,
      );
    } catch (err) {
      this.logger.error('Retention cleanup failed', (err as Error).stack);
    }
  }
}
