import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const referrals = await prisma.user.findMany({
    where: { referredBy: userId },
    select: {
      id: true,
      email: true,
      createdAt: true,
      userPlans: { select: { id: true } },
      referredBy: true,
    },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, referredBy: true, referralCode: true },
  });

  let referrer = null;
  if (user?.referredBy) {
    referrer = await prisma.user.findUnique({
      where: { id: user.referredBy },
      select: { email: true, referralCode: true },
    });
  }

  return NextResponse.json({ user, referrer, referrals });
}
