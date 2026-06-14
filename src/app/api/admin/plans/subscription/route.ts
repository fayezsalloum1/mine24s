import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const body = await req.json();
  const { planId, acceptingSubscriptions } = body;

  if (!planId || typeof planId !== "string") {
    return NextResponse.json({ error: "planId is required" }, { status: 400 });
  }
  if (typeof acceptingSubscriptions !== "boolean") {
    return NextResponse.json({ error: "acceptingSubscriptions must be a boolean" }, { status: 400 });
  }

  const plan = await prisma.plan.update({
    where: { id: planId },
    data: { acceptingSubscriptions },
    include: {
      _count: { select: { userPlans: true } },
    },
  });

  return NextResponse.json(plan);
}
