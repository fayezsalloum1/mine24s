ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'PLAN_PURCHASE';
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'PRINCIPAL_RETURN';

ALTER TABLE "UserPlan" ADD COLUMN IF NOT EXISTS "purchasePrice" DOUBLE PRECISION;
ALTER TABLE "UserPlan" ADD COLUMN IF NOT EXISTS "dailyReturnPercentSnapshot" DOUBLE PRECISION;
ALTER TABLE "UserPlan" ADD COLUMN IF NOT EXISTS "daysCredited" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "UserPlan" ADD COLUMN IF NOT EXISTS "lastEarningAt" TIMESTAMP(3);
ALTER TABLE "UserPlan" ADD COLUMN IF NOT EXISTS "principalReturned" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "UserPlan" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3);

UPDATE "UserPlan" up
SET
  "purchasePrice" = p."price",
  "dailyReturnPercentSnapshot" = p."dailyReturnPercent"
FROM "Plan" p
WHERE up."planId" = p."id"
  AND (up."purchasePrice" IS NULL OR up."dailyReturnPercentSnapshot" IS NULL);

UPDATE "UserPlan"
SET
  "purchasePrice" = 0,
  "dailyReturnPercentSnapshot" = 0
WHERE "purchasePrice" IS NULL OR "dailyReturnPercentSnapshot" IS NULL;

ALTER TABLE "UserPlan" ALTER COLUMN "purchasePrice" SET NOT NULL;
ALTER TABLE "UserPlan" ALTER COLUMN "dailyReturnPercentSnapshot" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "UserPlan_userId_isActive_idx" ON "UserPlan"("userId", "isActive");
CREATE INDEX IF NOT EXISTS "WithdrawalRequest_userId_status_idx" ON "WithdrawalRequest"("userId", "status");