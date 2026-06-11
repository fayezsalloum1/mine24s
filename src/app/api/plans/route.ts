import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatPlanForClient, getOpenPool } from "@/lib/plan-pool";

export async function GET() {
  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: [{ planType: "asc" }, { price: "asc" }],
  });

  const formatted = await Promise.all(
    plans.map(async (plan) => {
      const openPool = plan.planType === "POOLED" ? await getOpenPool(plan.id) : null;
      return formatPlanForClient(plan, openPool);
    })
  );

  return NextResponse.json(formatted);
}
export const dynamic = 'force-dynamic';
