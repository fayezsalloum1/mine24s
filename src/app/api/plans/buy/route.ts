import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { processReferralCommission } from "@/lib/referral";
import { joinPooledPlan, getSoloDailyProfit } from "@/lib/plan-pool";
import { createNotification, notifyAdmins } from "@/lib/notifications";

export async function POST(req: Request) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { user } = auth;
  const { planId, amount } = await req.json();

  if (user.isFrozen) return NextResponse.json({ error: "Account frozen" }, { status: 403 });

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan || !plan.isActive) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

  if (!plan.acceptingSubscriptions) {
    return NextResponse.json(
      { error: "This plan is full. Please select another plan.", planFull: true },
      { status: 400 }
    );
  }

  try {
    if (plan.planType === "POOLED") {
      const contributionAmount = Number(amount);
      if (!Number.isFinite(contributionAmount) || contributionAmount <= 0) {
        return NextResponse.json({ error: "Enter a valid contribution amount" }, { status: 400 });
      }

      const result = await joinPooledPlan(user.id, plan, contributionAmount);

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

    await prisma.$transaction(async (tx) => {
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
    });

    await processReferralCommission(user.id, plan.price);

    await createNotification(
      user.id,
      `Plan "${plan.name}" purchased for $${plan.price.toFixed(2)}! Mining started — 10-day payouts begin now. 100% principal returned when the plan completes.`
    );
    await notifyAdmins(
      `[Plan purchase] ${user.email} bought "${plan.name}" for $${plan.price.toFixed(2)}.`
    );

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
