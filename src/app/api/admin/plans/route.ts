import { NextResponse } from "next/server";
import { PoolStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { broadcastToUsers, notifyAdmins } from "@/lib/notifications";

export const dynamic = "force-dynamic";

const planInclude = {
  pools: {
    where: { status: { in: [PoolStatus.FILLING, PoolStatus.ACTIVE] } },
    include: { _count: { select: { contributions: true } } },
  },
  _count: { select: { userPlans: true } },
};

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
      acceptingSubscriptions: body.acceptingSubscriptions !== false,
      ...(typeof body.machineOnline === "boolean" ? { machineOnline: body.machineOnline } : {}),
      ...(body.machineUptimeHours != null && Number.isFinite(Number(body.machineUptimeHours))
        ? { machineUptimeHours: Math.max(0, Number(body.machineUptimeHours)) }
        : {}),
    },
  };
}

function applyMachineOnlineTransition(
  existing: {
    machineOnline: boolean;
    machineOnlineSince: Date | null;
    machineUptimeHours: number;
  },
  data: Record<string, unknown>
) {
  if (typeof data.machineOnline !== "boolean") return data;

  const now = new Date();
  if (data.machineOnline && !existing.machineOnline) {
    return { ...data, machineOnlineSince: now };
  }

  if (!data.machineOnline && existing.machineOnline) {
    const since = existing.machineOnlineSince ?? now;
    const added = (now.getTime() - since.getTime()) / (1000 * 60 * 60);
    return {
      ...data,
      machineOnlineSince: null,
      machineUptimeHours:
        typeof data.machineUptimeHours === "number"
          ? data.machineUptimeHours
          : existing.machineUptimeHours + added,
    };
  }

  return data;
}

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const plans = await prisma.plan.findMany({
    orderBy: { createdAt: "desc" },
    include: planInclude,
  });

  return NextResponse.json(plans, {
    headers: { "Cache-Control": "no-store" },
  });
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
    include: planInclude,
  });

  if (plan.isActive) {
    const msg = `New mining plan: "${plan.name}" — $${plan.price.toLocaleString()}, ${plan.dailyReturnPercent}% daily for ${plan.durationDays} days. 100% principal returned at completion.`;
    await broadcastToUsers(msg);
    await notifyAdmins(`[New plan] Published "${plan.name}" to all users.`);
  }

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

  const existing = await prisma.plan.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

  const updateData = applyMachineOnlineTransition(existing, parsed.data);

  const plan = await prisma.plan.update({
    where: { id },
    data: updateData,
    include: planInclude,
  });

  const newlyActivated = !existing.isActive && plan.isActive;
  if (newlyActivated) {
    const msg = `Mining plan now available: "${plan.name}" — $${plan.price.toLocaleString()}, ${plan.dailyReturnPercent}% daily, 100% principal back at end.`;
    await broadcastToUsers(msg);
    await notifyAdmins(`[Plan activated] "${plan.name}" is now live for users.`);
  }

  return NextResponse.json(plan);
}

async function resolvePlanId(req: Request) {
  const { searchParams } = new URL(req.url);
  const fromQuery = searchParams.get("id");
  if (fromQuery) return fromQuery;

  try {
    const body = await req.json();
    return typeof body?.id === "string" ? body.id : null;
  } catch {
    return null;
  }
}

export async function DELETE(req: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const id = await resolvePlanId(req);
  if (!id) return NextResponse.json({ error: "Plan id required" }, { status: 400 });

  const existing = await prisma.plan.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

  const activeUserPlans = await prisma.userPlan.count({
    where: { planId: id, isActive: true },
  });
  if (activeUserPlans > 0) {
    const plan = await prisma.plan.update({
      where: { id },
      data: { isActive: false, acceptingSubscriptions: false },
      include: planInclude,
    });
    return NextResponse.json({ success: true, softDeleted: true, plan });
  }

  const fillingPool = await prisma.planPool.findFirst({
    where: { planId: id, status: "FILLING", filledAmount: { gt: 0 } },
  });
  if (fillingPool) {
    const plan = await prisma.plan.update({
      where: { id },
      data: { isActive: false, acceptingSubscriptions: false },
      include: planInclude,
    });
    return NextResponse.json({ success: true, softDeleted: true, plan });
  }

  await prisma.plan.delete({ where: { id } });
  return NextResponse.json({ success: true, softDeleted: false, id });
}
