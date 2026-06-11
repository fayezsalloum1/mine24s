import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { sendEmail, referralCommissionHtml } from "@/lib/email";
import { sendSMS } from "@/lib/sms";

/** Pay 10% commission to referrer on the buyer's first plan purchase only. */
export async function processReferralCommission(
  buyerId: string,
  planPrice: number
) {
  const buyer = await prisma.user.findUnique({ where: { id: buyerId } });
  if (!buyer?.referredBy) return;

  const planPurchases = await prisma.transaction.count({
    where: { userId: buyerId, type: "PLAN_PURCHASE", status: "CONFIRMED" },
  });
  // Called after the purchase transaction — exactly one purchase means first buy.
  if (planPurchases !== 1) return;

  const commission = planPrice * 0.1;
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

  const message = `You earned $${commission.toFixed(2)} referral commission!`;
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

export async function canWithdraw(userId: string): Promise<boolean> {
  const referredWithPlan = await prisma.user.count({
    where: {
      referredBy: userId,
      userPlans: { some: {} },
    },
  });
  return referredWithPlan >= 1;
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
