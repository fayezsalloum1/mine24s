-- AlterTable: add nullable columns first
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "walletIndex" INTEGER;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tronDepositAddress" TEXT;

-- Backfill walletIndex from creation order
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt" ASC) - 1 AS idx
  FROM "User"
)
UPDATE "User" u
SET "walletIndex" = numbered.idx
FROM numbered
WHERE u.id = numbered.id AND u."walletIndex" IS NULL;

-- Temporary placeholder for tron addresses (backfill script will set real values)
UPDATE "User"
SET "tronDepositAddress" = 'pending-' || id
WHERE "tronDepositAddress" IS NULL;

-- Make columns required
ALTER TABLE "User" ALTER COLUMN "walletIndex" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "tronDepositAddress" SET NOT NULL;

-- Unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "User_walletIndex_key" ON "User"("walletIndex");
CREATE UNIQUE INDEX IF NOT EXISTS "User_tronDepositAddress_key" ON "User"("tronDepositAddress");

-- Transaction network/txHash
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "network" TEXT;
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "txHash" TEXT;

-- ProcessedDeposit table
CREATE TABLE IF NOT EXISTS "ProcessedDeposit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProcessedDeposit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ProcessedDeposit_network_txHash_key" ON "ProcessedDeposit"("network", "txHash");

ALTER TABLE "ProcessedDeposit" DROP CONSTRAINT IF EXISTS "ProcessedDeposit_userId_fkey";
ALTER TABLE "ProcessedDeposit" ADD CONSTRAINT "ProcessedDeposit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ScannerState table
CREATE TABLE IF NOT EXISTS "ScannerState" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "ethLastBlock" INTEGER NOT NULL DEFAULT 0,
    "bscLastBlock" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ScannerState_pkey" PRIMARY KEY ("id")
);

INSERT INTO "ScannerState" ("id", "ethLastBlock", "bscLastBlock")
VALUES ('main', 0, 0)
ON CONFLICT ("id") DO NOTHING;
