import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import type { Plan } from "@prisma/client";

type PlanWithPool = Plan & { targetPoolAmount: number | null; minContribution: number | null };

export function getSoloDailyProfit(price: number, dailyReturnPercent: number) {
  return (price * dailyReturnPercent) / 100;
}

export function getPooledUserDailyProfit(
  targetAmount: number,
  dailyReturnPercent: number,
  contribution: number
) {
  const poolDailyProfit = (targetAmount * dailyReturnPercent) / 100;
  return poolDailyProfit * (contribution / targetAmount);
}

export async function getOpenPool(planId: string) {
  return prisma.planPool.findFirst({
    where: { planId, status: "FILLING" },
    include: {
      contributions: {
        include: { user: { select: { id: true, email: true } } },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function activatePool(poolId: string) {
  const pool = await prisma.planPool.findUnique({
    where: { id: poolId },
    include: {
      plan: true,
      contributions: true,
    },
  });

  if (!pool || pool.status !== "FILLING") return null;
  if (pool.filledAmount < pool.targetAmount) return null;

  const startedAt = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.planPool.update({
      where: { id: poolId },
      data: { status: "ACTIVE", startedAt },
    });

    for (const contribution of pool.contributions) {
      const share = contribution.amount / pool.targetAmount;
      const dailyProfit = getPooledUserDailyProfit(
        pool.targetAmount,
        pool.dailyReturnPercent,
        contribution.amount
      );

      await tx.userPlan.create({
        data: {
          userId: contribution.userId,
          planId: pool.planId,
          poolId: pool.id,
          purchasedAt: startedAt,
          purchasePrice: contribution.amount,
          dailyReturnPercentSnapshot: pool.dailyReturnPercent,
          durationDaysSnapshot: pool.durationDays,
          dailyProfitSnapshot: dailyProfit,
          contributionShare: share,
        },
      });
    }
  });

  for (const contribution of pool.contributions) {
    await createNotification(
      contribution.userId,
      `Shared plan "${pool.plan.name}" is now active! Mining started with your $${contribution.amount.toFixed(2)} share.`
    );
  }

  return pool;
}

export async function joinPooledPlan(
  userId: string,
  plan: PlanWithPool,
  contributionAmount: number
) {
  const minContribution = plan.minContribution ?? 1;
  const targetAmount = plan.targetPoolAmount ?? plan.price;

  if (contributionAmount < minContribution) {
    throw new Error(`Minimum contribution is $${minContribution.toFixed(2)}`);
  }

  let pool = await getOpenPool(plan.id);

  if (!pool) {
    pool = await prisma.planPool.create({
      data: {
        planId: plan.id,
        targetAmount,
        durationDays: plan.durationDays,
        dailyReturnPercent: plan.dailyReturnPercent,
      },
      include: {
        contributions: {
          include: { user: { select: { id: true, email: true } } },
        },
      },
    });
  }

  const remaining = pool.targetAmount - pool.filledAmount;
  if (remaining <= 0) {
    throw new Error("This pool is already full. A new pool will open soon.");
  }

  if (contributionAmount > remaining) {
    throw new Error(`Maximum contribution right now is $${remaining.toFixed(2)}`);
  }

  if (plan.maxParticipants) {
    const participantCount = pool.contributions.length;
    const alreadyJoined = pool.contributions.some((c) => c.userId === userId);
    if (!alreadyJoined && participantCount >= plan.maxParticipants) {
      throw new Error("This pool has reached the maximum number of participants");
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const debit = await tx.user.updateMany({
      where: { id: userId, balance: { gte: contributionAmount } },
      data: { balance: { decrement: contributionAmount } },
    });
    if (debit.count !== 1) throw new Error("Insufficient balance");

    const existingPlansCount = await tx.userPlan.count({ where: { userId } });

    await tx.poolContribution.upsert({
      where: { poolId_userId: { poolId: pool!.id, userId } },
      create: { poolId: pool!.id, userId, amount: contributionAmount },
      update: { amount: { increment: contributionAmount } },
    });

    const updatedPool = await tx.planPool.update({
      where: { id: pool!.id },
      data: { filledAmount: { increment: contributionAmount } },
    });

    await tx.transaction.create({
      data: {
        userId,
        type: "PLAN_PURCHASE",
        amount: -contributionAmount,
        status: "CONFIRMED",
      },
    });

    return { updatedPool, isFirstPlan: existingPlansCount === 0 };
  });

  if (result.updatedPool.filledAmount >= result.updatedPool.targetAmount) {
    await activatePool(pool.id);
    return { activated: true, poolId: pool.id, filled: true, isFirstPlan: result.isFirstPlan };
  }

  await createNotification(
    userId,
    `You joined shared plan "${plan.name}" with $${contributionAmount.toFixed(2)}. Pool is ${((result.updatedPool.filledAmount / result.updatedPool.targetAmount) * 100).toFixed(0)}% filled.`
  );

  return { activated: false, poolId: pool.id, filled: false, isFirstPlan: result.isFirstPlan };
}

export function formatPlanForClient(
  plan: Plan,
  openPool?: Awaited<ReturnType<typeof getOpenPool>> | null
) {
  const isPooled = plan.planType === "POOLED";
  const target = plan.targetPoolAmount ?? plan.price;
  const filled = openPool?.filledAmount ?? 0;
  const participants = openPool?.contributions.length ?? 0;

  return {
    ...plan,
    isPooled,
    targetPoolAmount: target,
    poolProgress: isPooled ? Math.min(100, (filled / target) * 100) : 100,
    poolFilled: filled,
    poolRemaining: Math.max(0, target - filled),
    poolParticipants: participants,
    poolId: openPool?.id ?? null,
    soloDailyProfit: getSoloDailyProfit(plan.price, plan.dailyReturnPercent),
    poolDailyProfit: isPooled ? getSoloDailyProfit(target, plan.dailyReturnPercent) : null,
    minContribution: plan.minContribution ?? (isPooled ? 1 : plan.price),
  };
}
