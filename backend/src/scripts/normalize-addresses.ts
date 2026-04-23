/**
 * One-shot migration script: normalizes all Stellar addresses stored in the DB
 * to their canonical G-address / C-address form (strips mux IDs, rejects garbage).
 *
 * Run:
 *   npx ts-node src/scripts/normalize-addresses.ts
 *
 * Safe to re-run: already-canonical rows are skipped (no UPDATE issued).
 * Rows with un-parseable addresses are logged and left untouched so the team
 * can review them manually before deciding to delete or fix.
 */

import { PrismaClient } from '@prisma/client';
import { normalizeAddress, tryNormalizeAddress } from '../common/utils/normalize-address';

const prisma = new PrismaClient();

interface MigrationStats {
  checked: number;
  updated: number;
  skipped: number;
  invalid: number;
}

async function migrateColumn<T extends Record<string, unknown>>(
  label: string,
  rows: T[],
  idKey: keyof T,
  addressKey: keyof T,
  updateFn: (id: unknown, normalized: string) => Promise<void>,
): Promise<MigrationStats> {
  const stats: MigrationStats = { checked: rows.length, updated: 0, skipped: 0, invalid: 0 };

  for (const row of rows) {
    const raw = row[addressKey] as string;
    const normalized = tryNormalizeAddress(raw);

    if (normalized === null) {
      console.warn(`[INVALID] ${label} id=${String(row[idKey])} address="${raw}" — skipped`);
      stats.invalid++;
      continue;
    }

    if (normalized === raw) {
      stats.skipped++;
      continue;
    }

    await updateFn(row[idKey], normalized);
    console.log(`[UPDATED] ${label} id=${String(row[idKey])} "${raw}" → "${normalized}"`);
    stats.updated++;
  }

  return stats;
}

async function main(): Promise<void> {
  console.log('Starting address normalization migration…');

  // --- Policies ---
  const policies = await prisma.policy.findMany({ select: { id: true, holderAddress: true } });
  const policyStats = await migrateColumn(
    'Policy.holderAddress',
    policies as Array<{ id: string; holderAddress: string }>,
    'id',
    'holderAddress',
    (id, addr) => prisma.policy.update({ where: { id: id as string }, data: { holderAddress: addr } }).then(() => {}),
  );

  // --- Claims ---
  const claims = await prisma.claim.findMany({ select: { id: true, claimantAddress: true } });
  const claimStats = await migrateColumn(
    'Claim.claimantAddress',
    claims as Array<{ id: string; claimantAddress: string }>,
    'id',
    'claimantAddress',
    (id, addr) => prisma.claim.update({ where: { id: id as string }, data: { claimantAddress: addr } }).then(() => {}),
  );

  // --- Votes ---
  const votes = await prisma.vote.findMany({ select: { id: true, voterAddress: true } });
  const voteStats = await migrateColumn(
    'Vote.voterAddress',
    votes as Array<{ id: string; voterAddress: string }>,
    'id',
    'voterAddress',
    (id, addr) => prisma.vote.update({ where: { id: id as string }, data: { voterAddress: addr } }).then(() => {}),
  );

  const totals = [policyStats, claimStats, voteStats].reduce(
    (acc, s) => ({
      checked: acc.checked + s.checked,
      updated: acc.updated + s.updated,
      skipped: acc.skipped + s.skipped,
      invalid: acc.invalid + s.invalid,
    }),
    { checked: 0, updated: 0, skipped: 0, invalid: 0 },
  );

  console.log('\nMigration complete:', totals);
  if (totals.invalid > 0) {
    console.warn(`⚠  ${totals.invalid} rows with invalid addresses were skipped — review manually.`);
    process.exit(1);
  }
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
