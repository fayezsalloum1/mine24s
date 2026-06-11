import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { getPlanProgress } from "@/lib/mining-math";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const activePlans = await prisma.userPlan.findMany({
    where: { isActive: true },
    include: {
      user: { select: { id: true, email: true, balance: true, isFrozen: true } },
      plan: true,
    },
    orderBy: { purchasedAt: "desc" },
  });

  const rows = activePlans.map((up) => {
    const progress = getPlanProgress(up);
    return {
    ...progress,
    id: up.id,
    userId: up.user.id,
    email: up.user.email,
    balance: up.user.balance,
    isFrozen: up.user.isFrozen,
    planName: up.plan.name,
    planPrice: up.plan.price,
    purchasePrice: up.purchasePrice,
    dailyReturnPercent: up.plan.dailyReturnPercent,
    dailyReturnPercentSnapshot: up.dailyReturnPercentSnapshot,
    daysCredited: up.daysCredited,
    purchasedAt: up.purchasedAt,
    machineImage: up.plan.machineImage,
    durationDays: progress.durationDays,
    planType: up.plan.planType,
    contributionShare: up.contributionShare,
  };
  });

  return NextResponse.json(rows);
}