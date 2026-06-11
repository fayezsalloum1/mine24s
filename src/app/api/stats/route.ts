import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getDisplayActivePlans,
  getDisplayLiquidation,
  getDisplayUserCount,
} from "@/lib/platform-display-stats";

export async function GET() {
  try {
    const [realUsers, realActivePlans, deposits, withdrawals, balanceSum] = await Promise.all([
      prisma.user.count(),
      prisma.userPlan.count({ where: { isActive: true } }),
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
      activePlans: getDisplayActivePlans(realActivePlans, now),
      totalPaid: getDisplayLiquidation(realWithdrawals, now),
      realUsers,
      realActivePlans,
      totalDeposits: deposits._sum.amount ?? 0,
      totalWithdrawals: realWithdrawals,
      platformBalance: balanceSum._sum.balance ?? 0,
    });
  } catch {
    const { PLATFORM_DISPLAY_DEFAULTS } = await import("@/lib/platform-display-stats");
    return NextResponse.json(PLATFORM_DISPLAY_DEFAULTS);
  }
}

export const dynamic = "force-dynamic";
