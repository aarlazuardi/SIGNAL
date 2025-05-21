-- Prisma migration script to add originalHash field
-- This allows us to store both the final PDF hash and the original document hash
-- Save as: prisma/migrations/manual_add_original_hash/migration.sql

-- Add originalHash field to SignedDocument table
ALTER TABLE "SignedDocument" ADD COLUMN "originalHash" TEXT;

-- Add index on originalHash for faster lookups
CREATE INDEX "SignedDocument_originalHash_idx" ON "SignedDocument"("originalHash");

-- Update description in _prisma_migrations
INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES ('manual_add_original_hash', '6e12352ec73bc94ba38aeccf36783f93e8c6e5b02fe3cb0f7d3a4d93cfc8', NOW(), 'manual_add_original_hash', 'Added originalHash field to SignedDocument table', null, NOW(), 1)
ON CONFLICT (id) DO NOTHING;
