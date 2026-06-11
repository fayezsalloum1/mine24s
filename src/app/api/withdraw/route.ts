import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canWithdraw } from "@/lib/referral";
import { processDueMiningForUser } from "@/lib/mining";
import { getProfitBalanceForUser } from "@/lib/profit-balance";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { amount, network, withdrawalAddress } = await req.json();
  const withdrawalAmount = Number(amount);

  if (!Number.isFinite(withdrawalAmount) || withdrawalAmount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });
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

  const withdrawAllowed = await canWithdraw(user.id);
  if (!withdrawAllowed) {
    return NextResponse.json(
      { error: "Withdrawal locked. Refer at least 1 user who purchased a plan.", locked: true },
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

  const lastWithdrawal = await prisma.withdrawalRequest.findFirst({
    where: { userId: user.id },
    orderBy: { requestedAt: "desc" },
  });

  if (lastWithdrawal) {
    const daysSince = (Date.now() - lastWithdrawal.requestedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 7) {
      const daysLeft = Math.ceil(7 - daysSince);
      return NextResponse.json({ error: `You can withdraw again in ${daysLeft} day(s)` }, { status: 400 });
    }
  }

  await prisma.withdrawalRequest.create({
    data: {
      userId: user.id,
      amount: withdrawalAmount,
      network,
      withdrawalAddress: withdrawalAddress.trim(),
    },
  });

  return NextResponse.json({ success: true });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!currentUser) return NextResponse.json({ error: "Not found" }, { status: 404 });

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

  const withdrawAllowed = await canWithdraw(user.id);
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const profitBalance = await getProfitBalanceForUser(user.id, user.balance, user.userPlans);
  const totalDailyProfit = user.userPlans.reduce((sum, plan) => {
    const principal = plan.purchasePrice ?? plan.plan.price;
    const rate = plan.dailyReturnPercentSnapshot ?? plan.plan.dailyReturnPercent;
    return sum + (principal * rate) / 100;
  }, 0);

  return NextResponse.json({
    withdrawAllowed,
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