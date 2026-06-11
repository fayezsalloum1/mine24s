ALTER TABLE "ProcessedDeposit" ADD COLUMN IF NOT EXISTS "sweepTxHash" TEXT;
ALTER TABLE "ProcessedDeposit" ADD COLUMN IF NOT EXISTS "sweepError" TEXT;
