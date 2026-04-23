-- Migration: add soft-delete deletedAt columns to Policy, Claim, and Vote
-- Generated: 2026-03-28 12:00:00 UTC

ALTER TABLE "Policy" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "Claim"  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "Vote"   ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- Partial indexes so queries filtering deletedAt IS NULL stay fast
CREATE INDEX IF NOT EXISTS "Policy_deletedAt_idx" ON "Policy"("deletedAt");
CREATE INDEX IF NOT EXISTS "Claim_deletedAt_idx"  ON "Claim"("deletedAt");
CREATE INDEX IF NOT EXISTS "Vote_deletedAt_idx"   ON "Vote"("deletedAt");
