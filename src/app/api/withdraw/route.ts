import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { getWithdrawEligibility } from "@/lib/referral";
import { processDueMiningForUser } from "@/lib/mining";
import { getProfitBalanceForUser } from "@/lib/profit-balance";
import { createNotification, notifyAdmins } from "@/lib/notifications";
import { getAppUrl } from "@/lib/app-url";

const WITHDRAWAL_COOLDOWN_DAYS = 7;

function daysUntilNextWithdrawal(lastConfirmedAt: Date | null): number {
  if (!lastConfirmedAt) return 0;
  const daysSince = (Date.now() - lastConfirmedAt.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince >= WITHDRAWAL_COOLDOWN_DAYS) return 0;
  return Math.ceil(WITHDRAWAL_COOLDOWN_DAYS - daysSince);
}

export async function POST(req: Request) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;
  const { user: currentUser } = auth;
  const { amount, network, withdrawalAddress } = await req.json();
  const withdrawalAmount = Number(amount);

  if (!Number.isFinite(withdrawalAmount) || withdrawalAmount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  if (currentUser.isFrozen) return NextResponse.json({ error: "Account frozen" }, { status: 403 });

  await processDueMiningForUser(currentUser.id);

  const user = await prisma.user.findUnique({
    where: { id: currentUser.id },
    include: {
      userPlans: {
        where: { isActive: true },
        include: { plan: true },
      },
    },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (!network || !["ERC20", "BEP20", "TRC20"].includes(network)) {
    return NextResponse.json({ error: "Invalid network" }, { status: 400 });
  }

  if (!withdrawalAddress || typeof withdrawalAddress !== "string" || withdrawalAddress.trim().length < 20) {
    return NextResponse.json({ error: "Invalid withdrawal address" }, { status: 400 });
  }

  const withdrawEligibility = await getWithdrawEligibility(user.id);
  if (!withdrawEligibility.withdrawAllowed) {
    return NextResponse.json(
      {
        error: "Withdrawal locked. Refer at least 1 user who purchased a plan.",
        locked: true,
        requireReferralForWithdrawal: withdrawEligibility.requireReferralForWithdrawal,
      },
      { status: 400 }
    );
  }

  const profitBalance = await getProfitBalanceForUser(user.id, user.balance, user.userPlans);

  if (profitBalance.availableProfitBalance < withdrawalAmount) {
    return NextResponse.json(
      {
        error: `Insufficient profit balance. Available: $${profitBalance.availableProfitBalance.toFixed(2)}`,
      },
      { status: 400 }
    );
  }

  const lastApproved = await prisma.withdrawalRequest.findFirst({
    where: { userId: user.id, status: "CONFIRMED" },
    orderBy: { processedAt: "desc" },
  });

  const daysLeft = daysUntilNextWithdrawal(lastApproved?.processedAt ?? null);
  if (daysLeft > 0) {
    return NextResponse.json(
      { error: `You can withdraw again in ${daysLeft} day(s)` },
      { status: 400 }
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      const pending = await tx.withdrawalRequest.aggregate({
        where: { userId: user.id, status: "PENDING" },
        _sum: { amount: true },
      });
      const pendingSum = pending._sum.amount ?? 0;
      if (pendingSum + withdrawalAmount > profitBalance.availableProfitBalance) {
        throw new Error("INSUFFICIENT_PROFIT");
      }

      await tx.withdrawalRequest.create({
        data: {
          userId: user.id,
          amount: withdrawalAmount,
          network,
          withdrawalAddress: withdrawalAddress.trim(),
        },
      });
    });
  } catch (err) {
    if (err instanceof Error && err.message === "INSUFFICIENT_PROFIT") {
      return NextResponse.json(
        { error: "Insufficient profit balance (including pending withdrawals)" },
        { status: 400 }
      );
    }
    throw err;
  }

  await createNotification(
    user.id,
    `Withdrawal request submitted: $${withdrawalAmount.toFixed(2)} USDT on ${network}. Pending admin approval.`
  );
  await notifyAdmins(
    `[Withdrawal] ${user.email} requested $${withdrawalAmount.toFixed(2)} on ${network}.`
  );

  return NextResponse.json({ success: true });
}

export async function GET() {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { user: currentUser } = auth;

  await processDueMiningForUser(currentUser.id);

  const user = await prisma.user.findUnique({
    where: { id: currentUser.id },
    include: {
      userPlans: {
        where: { isActive: true },
        include: { plan: true },
      },
    },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const withdrawEligibility = await getWithdrawEligibility(user.id);
  const baseUrl = getAppUrl();
  const profitBalance = await getProfitBalanceForUser(user.id, user.balance, user.userPlans);
  const totalDailyProfit = user.userPlans.reduce((sum, plan) => {
    const principal = plan.purchasePrice ?? plan.plan.price;
    const rate = plan.dailyReturnPercentSnapshot ?? plan.plan.dailyReturnPercent;
    return sum + (principal * rate) / 100;
  }, 0);

  const lastApproved = await prisma.withdrawalRequest.findFirst({
    where: { userId: user.id, status: "CONFIRMED" },
    orderBy: { processedAt: "desc" },
  });
  const cooldownDaysLeft = daysUntilNextWithdrawal(lastApproved?.processedAt ?? null);

  return NextResponse.json({
    ...withdrawEligibility,
    withdrawAllowed: withdrawEligibility.withdrawAllowed,
    cooldownDaysLeft,
    referralLink: `${baseUrl}/register?ref=${user.referralCode}`,
    balance: user.balance,
    availableBalance: profitBalance.availableProfitBalance,
    availableProfitBalance: profitBalance.availableProfitBalance,
    accruingProfit: profitBalance.accruingProfit,
    creditedProfit: profitBalance.creditedProfit,
    pendingWithdrawalAmount: profitBalance.pendingWithdrawalAmount,
    totalDailyProfit,
    userPlans: user.userPlans.map((up) => ({
      purchasedAt: up.purchasedAt.toISOString(),
      isActive: up.isActive,
      purchasePrice: up.purchasePrice,
      dailyReturnPercentSnapshot: up.dailyReturnPercentSnapshot,
      durationDaysSnapshot: up.durationDaysSnapshot,
      daysCredited: up.daysCredited,
      principalReturned: up.principalReturned,
      plan: {
        price: up.plan.price,
        dailyReturnPercent: up.plan.dailyReturnPercent,
        durationDays: up.plan.durationDays,
      },
    })),
  });
}
