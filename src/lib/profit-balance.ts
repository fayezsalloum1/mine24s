import { prisma } from "@/lib/prisma";
import { getLiveAccruingProfit } from "@/lib/mining-math";

const PROFIT_TYPES = ["EARNING", "REFERRAL", "PRINCIPAL_RETURN"] as const;

export async function getCreditedProfitTotal(userId: string) {
  const [earned, withdrawn] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        userId,
        type: { in: [...PROFIT_TYPES] },
        status: "CONFIRMED",
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        userId,
        type: "WITHDRAWAL",
        status: "CONFIRMED",
      },
      _sum: { amount: true },
    }),
  ]);

  return (earned._sum.amount ?? 0) - (withdrawn._sum.amount ?? 0);
}

export async function getProfitBalanceForUser(
  userId: string,
  balance: number,
  activePlans: Array<{
    isActive: boolean;
    purchasedAt: Date;
    purchasePrice: number;
    dailyReturnPercentSnapshot: number;
    daysCredited: number;
    principalReturned: boolean;
    plan: { price: number; dailyReturnPercent: number };
  }>,
  now = new Date()
) {
  const [creditedProfit, pending] = await Promise.all([
    getCreditedProfitTotal(userId),
    prisma.withdrawalRequest.aggregate({
      where: { userId, status: "PENDING" },
      _sum: { amount: true },
    }),
  ]);

  const accruingProfit = getLiveAccruingProfit(activePlans, now);
  const pendingWithdrawalAmount = pending._sum.amount ?? 0;
  const totalProfit = creditedProfit + accruingProfit;
  const availableProfitBalance = Math.max(
    0,
    Math.min(balance - pendingWithdrawalAmount, totalProfit - pendingWithdrawalAmount)
  );

  return {
    creditedProfit,
    accruingProfit,
    totalProfit,
    pendingWithdrawalAmount,
    availableProfitBalance,
  };
}
