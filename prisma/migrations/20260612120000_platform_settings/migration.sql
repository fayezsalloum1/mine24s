-- PlatformSettings singleton for admin-controlled withdrawal rules
CREATE TABLE IF NOT EXISTS "PlatformSettings" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "requireReferralForWithdrawal" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "PlatformSettings" ("id", "requireReferralForWithdrawal")
VALUES ('main', true)
ON CONFLICT ("id") DO NOTHING;
