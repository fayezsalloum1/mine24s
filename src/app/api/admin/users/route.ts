import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const frozen = searchParams.get("frozen");
  const role = searchParams.get("role");
  const dateFrom = searchParams.get("dateFrom");
  const hasActivePlan = searchParams.get("hasActivePlan");

  const where: Record<string, unknown> = {};
  if (frozen === "true") where.isFrozen = true;
  if (frozen === "false") where.isFrozen = false;
  if (role) where.role = role;
  if (dateFrom) where.createdAt = { gte: new Date(dateFrom) };
  if (hasActivePlan === "true") {
    where.userPlans = { some: { isActive: true } };
  } else if (hasActivePlan === "false") {
    where.userPlans = { none: { isActive: true } };
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      role: true,
      walletIndex: true,
      depositAddress: true,
      tronDepositAddress: true,
      balance: true,
      isFrozen: true,
      referralCode: true,
      referredBy: true,
      phoneNumber: true,
      phoneVerified: true,
      twoFactorEnabled: true,
      createdAt: true,
      userPlans: {
        where: { isActive: true },
        include: { plan: true },
        orderBy: { purchasedAt: "desc" },
      },
      transactions: { orderBy: { createdAt: "desc" }, take: 5 },
      _count: { select: { notifications: true } },
    },
  });

  const usersWithReferrals = await Promise.all(
    users.map(async (user) => {
      const referralCount = await prisma.user.count({
        where: { referredBy: user.id },
      });
      let referredByEmail = null;
      if (user.referredBy) {
        const referrer = await prisma.user.findUnique({
          where: { id: user.referredBy },
          select: { email: true },
        });
        referredByEmail = referrer?.email ?? null;
      }

      const activePlans = user.userPlans.map((up) => ({
        id: up.id,
        planName: up.plan.name,
        planPrice: up.purchasePrice,
        dailyReturnPercent: up.dailyReturnPercentSnapshot,
        dailyProfit: (up.purchasePrice * up.dailyReturnPercentSnapshot) / 100,
        daysCredited: up.daysCredited,
        principalReturned: up.principalReturned,
        purchasedAt: up.purchasedAt,
      }));

      return {
        ...user,
        referralCount,
        referredByEmail,
        activePlanCount: activePlans.length,
        activePlans,
      };
    })
  );

  return NextResponse.json(usersWithReferrals);
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id, action, value } = await req.json();

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const numericValue = value === undefined ? null : Number(value);
  if (["addBalance", "subtractBalance"].includes(action) && (!Number.isFinite(numericValue) || numericValue! <= 0)) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  switch (action) {
    case "freeze":
      await prisma.user.update({ where: { id }, data: { isFrozen: true } });
      break;
    case "unfreeze":
      await prisma.user.update({ where: { id }, data: { isFrozen: false } });
      break;
    case "delete":
      await prisma.notification.deleteMany({ where: { userId: id } });
      await prisma.transaction.deleteMany({ where: { userId: id } });
      await prisma.withdrawalRequest.deleteMany({ where: { userId: id } });
      await prisma.userPlan.deleteMany({ where: { userId: id } });
      await prisma.processedDeposit.deleteMany({ where: { userId: id } });
      await prisma.user.delete({ where: { id } });
      break;
    case "addBalance":
      await prisma.user.update({
        where: { id },
        data: { balance: { increment: numericValue! } },
      });
      await prisma.transaction.create({
        data: {
          userId: id,
          type: "DEPOSIT",
          amount: numericValue!,
          status: "CONFIRMED",
        },
      });
      break;
    case "subtractBalance":
      try {
        await prisma.$transaction(async (tx) => {
          const debit = await tx.user.updateMany({
            where: { id, balance: { gte: numericValue! } },
            data: { balance: { decrement: numericValue! } },
          });
          if (debit.count !== 1) throw new Error("INSUFFICIENT_BALANCE");

          await tx.transaction.create({
            data: {
              userId: id,
              type: "WITHDRAWAL",
              amount: numericValue!,
              status: "CONFIRMED",
            },
          });
        });
      } catch (err) {
        if (err instanceof Error && err.message === "INSUFFICIENT_BALANCE") {
          return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
        }
        throw err;
      }
      break;
    case "changeEmail":
      await prisma.user.update({ where: { id }, data: { email: value } });
      break;
    case "resetPassword":
      await prisma.user.update({
        where: { id },
        data: { password: await bcrypt.hash(value, 10) },
      });
      break;
    case "changeRole":
      await prisma.user.update({ where: { id }, data: { role: value } });
      break;
    case "disable2fa":
      await prisma.user.update({
        where: { id },
        data: { twoFactorEnabled: false, twoFactorSecret: null },
      });
      break;
    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}