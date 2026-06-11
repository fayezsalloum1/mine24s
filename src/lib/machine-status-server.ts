import { prisma } from "@/lib/prisma";

export async function setPlanMachineOnline(planId: string, online: boolean) {
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) throw new Error("Plan not found");

  const now = new Date();

  if (online && !plan.machineOnline) {
    return prisma.plan.update({
      where: { id: planId },
      data: { machineOnline: true, machineOnlineSince: now },
    });
  }

  if (!online && plan.machineOnline) {
    const since = plan.machineOnlineSince ?? now;
    const added = (now.getTime() - since.getTime()) / (1000 * 60 * 60);
    return prisma.plan.update({
      where: { id: planId },
      data: {
        machineOnline: false,
        machineOnlineSince: null,
        machineUptimeHours: plan.machineUptimeHours + added,
      },
    });
  }

  return plan;
}

export async function setPlanMachineUptimeHours(planId: string, uptimeHours: number) {
  if (!Number.isFinite(uptimeHours) || uptimeHours < 0) {
    throw new Error("Invalid uptime hours");
  }

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) throw new Error("Plan not found");

  return prisma.plan.update({
    where: { id: planId },
    data: {
      machineUptimeHours: uptimeHours,
      ...(plan.machineOnline ? { machineOnlineSince: new Date() } : {}),
    },
  });
}
