import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { processReferralCommission } from "@/lib/referral";
import { joinPooledPlan, getSoloDailyProfit } from "@/lib/plan-pool";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { planId, amount } = await req.json();

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.isFrozen) return NextResponse.json({ error: "Account frozen" }, { status: 403 });

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan || !plan.isActive) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

  try {
    if (plan.planType === "POOLED") {
      const contributionAmount = Number(amount);
      if (!Number.isFinite(contributionAmount) || contributionAmount <= 0) {
        return NextResponse.json({ error: "Enter a valid contribution amount" }, { status: 400 });
      }

      const result = await joinPooledPlan(user.id, plan, contributionAmount);

      if (result.isFirstPlan) {
        await processReferralCommission(user.id, contributionAmount);
      }

      return NextResponse.json({
        success: true,
        pooled: true,
        activated: result.activated,
        message: result.activated
          ? "Pool is full! Mining has started for all participants."
          : "Joined shared plan. Waiting for pool to fill.",
      });
    }

    if (user.balance < plan.price) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    const { isFirstPlan } = await prisma.$transaction(async (tx) => {
      const existingPlansCount = await tx.userPlan.count({
        where: { userId: user.id },
      });

      const debit = await tx.user.updateMany({
        where: { id: user.id, balance: { gte: plan.price } },
        data: { balance: { decrement: plan.price } },
      });

      if (debit.count !== 1) {
        throw new Error("Insufficient balance");
      }

      await tx.userPlan.create({
        data: {
          userId: user.id,
          planId: plan.id,
          purchasePrice: plan.price,
          dailyReturnPercentSnapshot: plan.dailyReturnPercent,
          durationDaysSnapshot: plan.durationDays,
          dailyProfitSnapshot: getSoloDailyProfit(plan.price, plan.dailyReturnPercent),
        },
      });

      await tx.transaction.create({
        data: {
          userId: user.id,
          type: "PLAN_PURCHASE",
          amount: -plan.price,
          status: "CONFIRMED",
        },
      });

      return { isFirstPlan: existingPlansCount === 0 };
    });

    if (isFirstPlan) {
      await processReferralCommission(user.id, plan.price);
    }

    return NextResponse.json({ success: true, pooled: false });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "Insufficient balance") {
        return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
      }
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
