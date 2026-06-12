-- Allow admin to freeze new subscriptions while existing user plans stay active
ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "acceptingSubscriptions" BOOLEAN NOT NULL DEFAULT true;
