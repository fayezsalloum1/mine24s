import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [totalUsers, deposits, withdrawals, balanceSum] = await Promise.all([
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

  return NextResponse.json({
    totalUsers,
    totalDeposits: deposits._sum.amount ?? 0,
    totalWithdrawals: withdrawals._sum.amount ?? 0,
    totalPaid: (deposits._sum.amount ?? 0) + (withdrawals._sum.amount ?? 0),
    platformBalance: balanceSum._sum.balance ?? 0,
  });
}
