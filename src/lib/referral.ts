import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { sendEmail, referralCommissionHtml } from "@/lib/email";
import { sendSMS } from "@/lib/sms";
import { getPlatformSettings } from "@/lib/platform-settings";

const REFERRAL_COMMISSION_RATE = 0.1;

/** Pay 10% commission to referrer on every plan purchase by a referred user. */
export async function processReferralCommission(
  buyerId: string,
  planPrice: number
) {
  const buyer = await prisma.user.findUnique({ where: { id: buyerId } });
  if (!buyer?.referredBy) return;

  const commission = planPrice * REFERRAL_COMMISSION_RATE;
  const referrer = await prisma.user.findUnique({
    where: { id: buyer.referredBy },
  });
  if (!referrer) return;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: referrer.id },
      data: { balance: { increment: commission } },
    }),
    prisma.transaction.create({
      data: {
        userId: referrer.id,
        type: "REFERRAL",
        amount: commission,
        status: "CONFIRMED",
      },
    }),
  ]);

  const message = `You earned $${commission.toFixed(2)} referral commission (10% on a referred user's plan purchase)!`;
  await createNotification(referrer.id, message);
  await sendEmail(
    referrer.email,
    "Referral Commission Earned",
    referralCommissionHtml(commission)
  );
  if (referrer.phoneNumber && referrer.phoneVerified) {
    await sendSMS(referrer.phoneNumber, message);
  }
}

/** Referred user with at least one confirmed plan purchase or active plan. */
export async function hasActiveReferral(userId: string): Promise<boolean> {
  const referredWithPlan = await prisma.user.count({
    where: {
      referredBy: userId,
      OR: [
        { userPlans: { some: { isActive: true } } },
        {
          transactions: {
            some: { type: "PLAN_PURCHASE", status: "CONFIRMED" },
          },
        },
      ],
    },
  });
  return referredWithPlan >= 1;
}

export async function canWithdraw(userId: string): Promise<boolean> {
  const settings = await getPlatformSettings();
  if (!settings.requireReferralForWithdrawal) {
    return true;
  }
  return hasActiveReferral(userId);
}

export async function getWithdrawEligibility(userId: string) {
  const settings = await getPlatformSettings();
  const hasReferral = await hasActiveReferral(userId);
  const allowed = !settings.requireReferralForWithdrawal || hasReferral;
  return {
    withdrawAllowed: allowed,
    requireReferralForWithdrawal: settings.requireReferralForWithdrawal,
    hasActiveReferral: hasReferral,
  };
}

export async function getReferralStats(userId: string) {
  const totalReferrals = await prisma.user.count({
    where: { referredBy: userId },
  });
  const referralEarnings = await prisma.transaction.aggregate({
    where: { userId, type: "REFERRAL", status: "CONFIRMED" },
    _sum: { amount: true },
  });
  return {
    totalReferrals,
    totalEarned: referralEarnings._sum.amount ?? 0,
  };
}

export function normalizeReferralCode(code: string) {
  return code.trim().toUpperCase();
}
