ALTER TABLE "User" ADD COLUMN "isFrozen" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "referredBy" TEXT;
ALTER TABLE "User" ADD COLUMN "referralCode" TEXT NOT NULL DEFAULT '';
UPDATE "User" SET "referralCode" = id WHERE "referralCode" = '';
ALTER TABLE "User" ADD CONSTRAINT "User_referralCode_key" UNIQUE ("referralCode");
ALTER TYPE "TransactionType" ADD VALUE 'REFERRAL';