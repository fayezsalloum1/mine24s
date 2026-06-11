-- AlterTable
ALTER TABLE "User" ADD COLUMN "phoneOtpCode" TEXT;
ALTER TABLE "User" ADD COLUMN "phoneOtpExpiresAt" TIMESTAMP(3);
