-- DropIndex
DROP INDEX "UserPlan_userId_isActive_idx";

-- DropIndex
DROP INDEX "WithdrawalRequest_userId_status_idx";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerificationAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "emailVerificationCode" TEXT,
ADD COLUMN     "emailVerificationExpiry" TIMESTAMP(3),
ADD COLUMN     "emailVerificationLockedUntil" TIMESTAMP(3),
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fullName" TEXT,
ADD COLUMN     "passwordResetExpiry" TIMESTAMP(3),
ADD COLUMN     "passwordResetRequestCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "passwordResetRequestWindow" TIMESTAMP(3),
ADD COLUMN     "passwordResetToken" TEXT;
