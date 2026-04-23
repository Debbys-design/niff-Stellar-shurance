import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

/**
 * Ledger indexer service.
 *
 * Fetches ledgers from the Soroban RPC in configurable batches and processes
 * each ledger's events into the local database.
 *
 * Environment variables
 * ---------------------
 * INDEXER_BATCH_SIZE   – number of ledgers to fetch per RPC call (default: 10, min: 1, max: 100)
 *
 * Tuning guidance: see docs/indexer-runbook.md
 */

/** Validated, clamped batch size read once at startup. */
export function resolveBatchSize(): number {
  const raw = parseInt(process.env.INDEXER_BATCH_SIZE ?? '10', 10);
  if (isNaN(raw)) {
    throw new Error(`INDEXER_BATCH_SIZE must be a number, got "${process.env.INDEXER_BATCH_SIZE}"`);
  }
  if (raw < 1 || raw > 100) {
    throw new Error(`INDEXER_BATCH_SIZE must be between 1 and 100, got ${raw}`);
  }
  return raw;
}

@Injectable()
export class IndexerService implements OnModuleInit {
  private readonly logger = new Logger(IndexerService.name);
  readonly batchSize: number;

  /** Prometheus-style metric: sum of batch durations and count for average calculation. */
  private batchDurationMs = 0;
  private batchCount = 0;

  constructor() {
    this.batchSize = resolveBatchSize();
    this.logger.log(`Indexer batch size: ${this.batchSize}`);
  }

  onModuleInit(): void {
    this.logger.log('IndexerService initialized');
  }

  /**
   * Fetches and processes one batch of ledgers starting at `fromLedger`.
   * Returns the next ledger sequence to continue from.
   *
   * RPC rate-limit note: each call to this method consumes 1 RPC request
   * regardless of batch size. Larger batches reduce RPC call frequency but
   * increase per-call latency and memory usage. See the runbook for guidance.
   */
  async processBatch(fromLedger: number, fetchLedgers: (from: number, count: number) => Promise<unknown[]>): Promise<number> {
    const start = Date.now();

    const ledgers = await fetchLedgers(fromLedger, this.batchSize);
    await this.processLedgers(ledgers);

    const elapsed = Date.now() - start;
    this.recordBatchDuration(elapsed);
    this.logger.debug(`Batch [${fromLedger}..${fromLedger + ledgers.length - 1}] processed in ${elapsed}ms`);

    return fromLedger + ledgers.length;
  }

  /** Records batch duration for average metric. */
  private recordBatchDuration(ms: number): void {
    this.batchDurationMs += ms;
    this.batchCount++;
  }

  /**
   * Returns the average batch processing time in milliseconds.
   * Exposed for Prometheus scrape or structured log emission.
   */
  getAverageBatchDurationMs(): number {
    return this.batchCount === 0 ? 0 : this.batchDurationMs / this.batchCount;
  }

  /** Stub: replace with real event parsing and DB writes. */
  private async processLedgers(_ledgers: unknown[]): Promise<void> {
    // TODO: parse ledger events and upsert into DB
  }
}
