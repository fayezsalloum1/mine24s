import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canWithdraw, getReferralStats } from "@/lib/referral";
import { processDueMiningForUser } from "@/lib/mining";
import { getProfitBalanceForUser } from "@/lib/profit-balance";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!currentUser) {
      return NextResponse.json({ error: "User not found", staleSession: true }, { status: 404 });
    }

    try {
      await processDueMiningForUser(currentUser.id);
    } catch (miningError) {
      console.error("[user/me] mining process failed:", miningError);
    }

    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      include: {
        userPlans: {
          include: { plan: true },
        },
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found", staleSession: true }, { status: 404 });
    }

    const referralStats = await getReferralStats(user.id);
    const withdrawAllowed = await canWithdraw(user.id);
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const activePlans = user.userPlans.filter((plan) => plan.isActive);
    const profitBalance = await getProfitBalanceForUser(user.id, user.balance, activePlans);
    const pendingPoolJoins = await prisma.poolContribution.findMany({
      where: { userId: user.id, pool: { status: "FILLING" } },
      include: {
        pool: {
          include: { plan: true },
        },
      },
    });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      balance: user.balance,
      ...profitBalance,
      walletIndex: user.walletIndex,
      depositAddress: user.depositAddress,
      tronDepositAddress: user.tronDepositAddress,
      depositAddresses: {
        ERC20: user.depositAddress,
        BEP20: user.depositAddress,
        TRC20: user.tronDepositAddress,
      },
      referralCode: user.referralCode,
      referralLink: `${baseUrl}/register?ref=${user.referralCode}`,
      twoFactorEnabled: user.twoFactorEnabled,
      phoneNumber: user.phoneNumber,
      phoneVerified: user.phoneVerified,
      userPlans: user.userPlans,
      pendingPoolJoins: pendingPoolJoins.map((c) => ({
        id: c.id,
        amount: c.amount,
        planName: c.pool.plan.name,
        targetAmount: c.pool.targetAmount,
        filledAmount: c.pool.filledAmount,
        progress: (c.pool.filledAmount / c.pool.targetAmount) * 100,
      })),
      transactions: user.transactions,
      totalReferrals: referralStats.totalReferrals,
      totalReferralEarned: referralStats.totalEarned,
      withdrawAllowed,
    });
  } catch (error) {
    console.error("[user/me] unexpected error:", error);
    return NextResponse.json({ error: "Failed to load user data" }, { status: 500 });
  }
}