import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const [totalUsers, usersWithActivePlans, totalActivePlans, deposits, withdrawals, balanceSum] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { userPlans: { some: { isActive: true } } },
      }),
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

  return NextResponse.json({
    totalUsers,
    usersWithActivePlans,
    totalActivePlans,
    totalDeposits: deposits._sum.amount ?? 0,
    totalWithdrawals: withdrawals._sum.amount ?? 0,
    platformBalance: balanceSum._sum.balance ?? 0,
  });
}
