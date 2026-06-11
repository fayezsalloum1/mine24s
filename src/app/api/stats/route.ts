import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getDisplayLiquidation,
  getDisplayUserCount,
} from "@/lib/platform-display-stats";

export async function GET() {
  const [realUsers, deposits, withdrawals, balanceSum] = await Promise.all([
    prisma.user.count(),
    prisma.transaction.aggregate({
      where: { type: "DEPOSIT", status: "CONFIRMED", amount: { gt: 0 } },
      _sum: { amount: true },
    }),
    prisma.withdrawalRequest.aggregate({
      where: { status: "CONFIRMED" },
      _sum: { amount: true },
    }),
    prisma.user.aggregate({ _sum: { balance: true } }),
  ]);

  const realWithdrawals = withdrawals._sum.amount ?? 0;
  const now = Date.now();

  return NextResponse.json({
    totalUsers: getDisplayUserCount(realUsers, now),
    totalLiquidation: getDisplayLiquidation(realWithdrawals, now),
    totalPaid: getDisplayLiquidation(realWithdrawals, now),
    realUsers,
    totalDeposits: deposits._sum.amount ?? 0,
    totalWithdrawals: realWithdrawals,
    platformBalance: balanceSum._sum.balance ?? 0,
  });
}

export const dynamic = "force-dynamic";
