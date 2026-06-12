import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { sendEmail } from "@/lib/email";

export { getPlanProgress, PLAN_DURATION_DAYS } from "@/lib/mining-math";
import { getPlanProgress } from "@/lib/mining-math";

export async function processDueMiningForUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });
  if (!user) return { earned: 0, principalReturned: 0, plansUpdated: 0 };

  const userPlans = await prisma.userPlan.findMany({
    where: { userId, isActive: true },
    include: { plan: true },
  });

  let earned = 0;
  let principalReturned = 0;
  let plansUpdated = 0;

  for (const userPlan of userPlans) {
    const now = new Date();
    let message: string | null = null;

    await prisma.$transaction(async (tx) => {
      const latestPlan = await tx.userPlan.findUnique({
        where: { id: userPlan.id },
        include: { plan: true },
      });
      if (!latestPlan || !latestPlan.isActive) return;

      const progress = getPlanProgress(latestPlan, now);
      const shouldCreditEarnings = progress.daysToCredit > 0 && progress.earningsDue > 0;
      const shouldReturnPrincipal = progress.principalDue;
      if (!shouldCreditEarnings && !shouldReturnPrincipal) return;

      const creditAmount = progress.earningsDue + (shouldReturnPrincipal ? progress.principal : 0);

      await tx.user.update({
        where: { id: userId },
        data: { balance: { increment: creditAmount } },
      });

      if (shouldCreditEarnings) {
        await tx.transaction.create({
          data: {
            userId,
            type: "EARNING",
            amount: progress.earningsDue,
            status: "CONFIRMED",
          },
        });
      }

      if (shouldReturnPrincipal) {
        await tx.transaction.create({
          data: {
            userId,
            type: "PRINCIPAL_RETURN",
            amount: progress.principal,
            status: "CONFIRMED",
          },
        });
      }

      await tx.userPlan.update({
        where: { id: latestPlan.id },
        data: {
          daysCredited: { increment: progress.daysToCredit },
          lastEarningAt: shouldCreditEarnings ? now : latestPlan.lastEarningAt,
          principalReturned: shouldReturnPrincipal ? true : latestPlan.principalReturned,
          isActive: shouldReturnPrincipal ? false : latestPlan.isActive,
          completedAt: shouldReturnPrincipal ? now : latestPlan.completedAt,
        },
      });

      earned += progress.earningsDue;
      principalReturned += shouldReturnPrincipal ? progress.principal : 0;
      plansUpdated += 1;
      message = shouldReturnPrincipal
        ? `Mining plan credited $${progress.earningsDue.toFixed(2)} earnings and returned $${progress.principal.toFixed(2)} principal.`
        : `Mining earnings of $${progress.earningsDue.toFixed(2)} credited (${progress.daysToCredit}-day payout).`;
    });

    if (message) {
      try {
        await createNotification(userId, message);
        await sendEmail(user.email, "Mining Earnings Credited", `<p>${message}</p>`);
      } catch (notifyError) {
        console.error("[mining] notification failed:", notifyError);
      }
    }
  }

  return { earned, principalReturned, plansUpdated };
}

export async function processAllDueMiningEarnings() {
  const activePlans = await prisma.userPlan.findMany({
    where: { isActive: true },
    select: { userId: true },
    distinct: ["userId"],
  });

  let earned = 0;
  let principalReturned = 0;
  let plansUpdated = 0;

  for (const { userId } of activePlans) {
    const result = await processDueMiningForUser(userId);
    earned += result.earned;
    principalReturned += result.principalReturned;
    plansUpdated += result.plansUpdated;
  }

  return { earned, principalReturned, plansUpdated };
}