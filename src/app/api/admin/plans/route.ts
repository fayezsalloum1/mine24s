import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

function parsePlanBody(body: Record<string, unknown>) {
  const planType = body.planType === "POOLED" ? "POOLED" : "SOLO";
  const price = Number(body.price);
  const dailyReturnPercent = Number(body.dailyReturnPercent);
  const durationDays = Number(body.durationDays ?? 100);
  const targetPoolAmount = body.targetPoolAmount != null ? Number(body.targetPoolAmount) : null;
  const minContribution = body.minContribution != null ? Number(body.minContribution) : null;
  const maxParticipants = body.maxParticipants != null ? Number(body.maxParticipants) : null;

  if (!body.name || typeof body.name !== "string") {
    return { error: "Name is required" };
  }
  if (!Number.isFinite(price) || price <= 0) {
    return { error: "Valid price is required" };
  }
  if (!Number.isFinite(dailyReturnPercent) || dailyReturnPercent <= 0) {
    return { error: "Valid daily return % is required" };
  }
  if (!Number.isFinite(durationDays) || durationDays < 1) {
    return { error: "Valid duration is required" };
  }
  if (planType === "POOLED") {
    if (targetPoolAmount == null || !Number.isFinite(targetPoolAmount) || targetPoolAmount <= 0) {
      return { error: "Target pool amount is required for shared plans" };
    }
  }

  return {
    data: {
      name: body.name.trim(),
      description: typeof body.description === "string" ? body.description.trim() : null,
      price,
      dailyReturnPercent,
      durationDays: Math.floor(durationDays),
      machineImage: typeof body.machineImage === "string" ? body.machineImage.trim() : null,
      machineVideo: typeof body.machineVideo === "string" ? body.machineVideo.trim() || null : null,
      planType: planType as "SOLO" | "POOLED",
      targetPoolAmount: planType === "POOLED" ? targetPoolAmount : null,
      minContribution: planType === "POOLED" ? (minContribution ?? 1) : null,
      maxParticipants: planType === "POOLED" && maxParticipants ? Math.floor(maxParticipants) : null,
      isActive: body.isActive !== false,
      ...(typeof body.machineOnline === "boolean" ? { machineOnline: body.machineOnline } : {}),
      ...(body.machineUptimeHours != null && Number.isFinite(Number(body.machineUptimeHours))
        ? { machineUptimeHours: Math.max(0, Number(body.machineUptimeHours)) }
        : {}),
    },
  };
}

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const plans = await prisma.plan.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      pools: {
        where: { status: { in: ["FILLING", "ACTIVE"] } },
        include: { _count: { select: { contributions: true } } },
      },
      _count: { select: { userPlans: true } },
    },
  });

  return NextResponse.json(plans);
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const body = await req.json();
  const parsed = parsePlanBody(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const plan = await prisma.plan.create({
    data: {
      ...parsed.data,
      machineOnlineSince: parsed.data.machineOnline !== false ? new Date() : null,
    },
  });
  return NextResponse.json(plan);
}

export async function PUT(req: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const body = await req.json();
  const { id, ...rest } = body;
  if (!id) return NextResponse.json({ error: "Plan id required" }, { status: 400 });

  const parsed = parsePlanBody(rest);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const plan = await prisma.plan.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json(plan);
}

export async function DELETE(req: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Plan id required" }, { status: 400 });

  const activeUserPlans = await prisma.userPlan.count({
    where: { planId: id, isActive: true },
  });
  if (activeUserPlans > 0) {
    await prisma.plan.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ success: true, softDeleted: true });
  }

  const fillingPool = await prisma.planPool.findFirst({
    where: { planId: id, status: "FILLING", filledAmount: { gt: 0 } },
  });
  if (fillingPool) {
    await prisma.plan.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ success: true, softDeleted: true });
  }

  await prisma.plan.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
