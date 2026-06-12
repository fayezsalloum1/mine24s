import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWithdrawEligibility, getReferralStats } from "@/lib/referral";
import { getProfitBalanceForUser } from "@/lib/profit-balance";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

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

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const activePlans = user.userPlans.filter((plan) => plan.isActive);

    let profitBalance = {
      creditedProfit: 0,
      accruingProfit: 0,
      totalProfit: 0,
      pendingWithdrawalAmount: 0,
      availableProfitBalance: 0,
    };
    let referralStats = { totalReferrals: 0, totalEarned: 0 };
    let withdrawEligibility = {
      withdrawAllowed: true,
      requireReferralForWithdrawal: false,
      hasActiveReferral: false,
    };
    let pendingPoolJoins: Array<{
      id: string;
      amount: number;
      planName: string;
      targetAmount: number;
      filledAmount: number;
      progress: number;
    }> = [];

    try {
      profitBalance = await getProfitBalanceForUser(user.id, user.balance, activePlans);
    } catch (err) {
      console.error("[user/me] profit balance failed:", err);
    }

    try {
      referralStats = await getReferralStats(user.id);
      withdrawEligibility = await getWithdrawEligibility(user.id);
      const joins = await prisma.poolContribution.findMany({
        where: { userId: user.id, pool: { status: "FILLING" } },
        include: {
          pool: {
            include: { plan: true },
          },
        },
      });
      pendingPoolJoins = joins.map((c) => ({
        id: c.id,
        amount: c.amount,
        planName: c.pool.plan.name,
        targetAmount: c.pool.targetAmount,
        filledAmount: c.pool.filledAmount,
        progress: (c.pool.filledAmount / c.pool.targetAmount) * 100,
      }));
    } catch (err) {
      console.error("[user/me] secondary data failed:", err);
    }

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
      pendingPoolJoins,
      transactions: user.transactions,
      totalReferrals: referralStats.totalReferrals,
      totalReferralEarned: referralStats.totalEarned,
      ...withdrawEligibility,
      withdrawAllowed: withdrawEligibility.withdrawAllowed,
    });
  } catch (error) {
    console.error("[user/me] unexpected error:", error);
    return NextResponse.json({ error: "Failed to load user data" }, { status: 500 });
  }
}
