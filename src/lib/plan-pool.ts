import { prisma } from "@/lib/prisma";
import { createNotification, notifyAdmins } from "@/lib/notifications";
import { getPooledUserDailyProfit, getSoloDailyProfit } from "@/lib/mining-math";
import type { Plan } from "@prisma/client";

type PlanWithPool = Plan & { targetPoolAmount: number | null; minContribution: number | null };

export { getSoloDailyProfit, getPooledUserDailyProfit } from "@/lib/mining-math";

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
  const startedAt = new Date();

  const pool = await prisma.$transaction(async (tx) => {
    const current = await tx.planPool.findUnique({
      where: { id: poolId },
      include: { plan: true, contributions: true },
    });

    if (!current || current.status !== "FILLING") return null;
    if (current.filledAmount < current.targetAmount) return null;

    const locked = await tx.planPool.updateMany({
      where: { id: poolId, status: "FILLING" },
      data: { status: "ACTIVE", startedAt },
    });
    if (locked.count !== 1) return null;

    for (const contribution of current.contributions) {
      const share = contribution.amount / current.targetAmount;
      const dailyProfit = getPooledUserDailyProfit(
        current.targetAmount,
        current.dailyReturnPercent,
        contribution.amount
      );

      await tx.userPlan.create({
        data: {
          userId: contribution.userId,
          planId: current.planId,
          poolId: current.id,
          purchasedAt: startedAt,
          purchasePrice: contribution.amount,
          dailyReturnPercentSnapshot: current.dailyReturnPercent,
          durationDaysSnapshot: current.durationDays,
          dailyProfitSnapshot: dailyProfit,
          contributionShare: share,
        },
      });
    }

    return current;
  });

  if (!pool) return null;

  for (const contribution of pool.contributions) {
    await createNotification(
      contribution.userId,
      `Shared plan "${pool.plan.name}" is now active! Mining started with your $${contribution.amount.toFixed(2)} share. Duration clock has started.`
    );
  }

  await notifyAdmins(
    `[Pool active] "${pool.plan.name}" reached 100% — mining started for ${pool.contributions.length} participant(s).`
  );

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

  const result = await prisma.$transaction(async (tx) => {
    const livePool = await tx.planPool.findUnique({
      where: { id: pool!.id },
      include: { contributions: true },
    });

    if (!livePool || livePool.status !== "FILLING") {
      throw new Error("This pool is no longer available. Please try again.");
    }

    const remaining = livePool.targetAmount - livePool.filledAmount;
    if (remaining <= 0) {
      throw new Error("This pool is already full. A new pool will open soon.");
    }

    if (contributionAmount > remaining) {
      throw new Error(`Maximum contribution right now is $${remaining.toFixed(2)}`);
    }

    if (plan.maxParticipants) {
      const participantCount = livePool.contributions.length;
      const alreadyJoined = livePool.contributions.some((c) => c.userId === userId);
      if (!alreadyJoined && participantCount >= plan.maxParticipants) {
        throw new Error("This pool has reached the maximum number of participants");
      }
    }

    const debit = await tx.user.updateMany({
      where: { id: userId, balance: { gte: contributionAmount } },
      data: { balance: { decrement: contributionAmount } },
    });
    if (debit.count !== 1) throw new Error("Insufficient balance");

    await tx.poolContribution.upsert({
      where: { poolId_userId: { poolId: livePool.id, userId } },
      create: { poolId: livePool.id, userId, amount: contributionAmount },
      update: { amount: { increment: contributionAmount } },
    });

    const updatedPool = await tx.planPool.update({
      where: { id: livePool.id },
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

    return { updatedPool, poolId: livePool.id };
  });

  await processReferralCommissionSafe(userId, contributionAmount);

  if (result.updatedPool.filledAmount >= result.updatedPool.targetAmount) {
    const activated = await activatePool(result.poolId);
    return { activated: activated !== null, poolId: result.poolId, filled: true };
  }

  await createNotification(
    userId,
    `You joined shared plan "${plan.name}" with $${contributionAmount.toFixed(2)}. Pool is ${((result.updatedPool.filledAmount / result.updatedPool.targetAmount) * 100).toFixed(0)}% filled — mining starts at 100%.`
  );

  await notifyAdmins(
    `[Pool join] User joined "${plan.name}" with $${contributionAmount.toFixed(2)} (${((result.updatedPool.filledAmount / result.updatedPool.targetAmount) * 100).toFixed(0)}% filled).`
  );

  return { activated: false, poolId: result.poolId, filled: false };
}

async function processReferralCommissionSafe(userId: string, amount: number) {
  const { processReferralCommission } = await import("@/lib/referral");
  await processReferralCommission(userId, amount);
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
