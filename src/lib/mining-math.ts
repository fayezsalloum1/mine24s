export const DEFAULT_PLAN_DURATION_DAYS = 100;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

type PlanProgressInput = {
  purchasedAt: Date | string;
  purchasePrice?: number | null;
  dailyReturnPercentSnapshot?: number | null;
  durationDaysSnapshot?: number | null;
  dailyProfitSnapshot?: number | null;
  daysCredited?: number | null;
  principalReturned?: boolean | null;
  isActive?: boolean | null;
  contributionShare?: number | null;
  plan: {
    price: number;
    dailyReturnPercent: number;
    durationDays?: number | null;
  };
};

function startOfUtcDay(date: Date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function getPlanDurationDays(userPlan: PlanProgressInput) {
  return (
    userPlan.durationDaysSnapshot ??
    userPlan.plan.durationDays ??
    DEFAULT_PLAN_DURATION_DAYS
  );
}

export function getDailyProfit(userPlan: PlanProgressInput) {
  if (userPlan.dailyProfitSnapshot != null) {
    return userPlan.dailyProfitSnapshot;
  }
  const principal = userPlan.purchasePrice ?? userPlan.plan.price;
  const dailyReturnPercent =
    userPlan.dailyReturnPercentSnapshot ?? userPlan.plan.dailyReturnPercent;
  return (principal * dailyReturnPercent) / 100;
}

export function elapsedMiningDays(purchasedAt: Date | string, now = new Date()) {
  const purchased = typeof purchasedAt === "string" ? new Date(purchasedAt) : purchasedAt;
  return Math.max(0, Math.floor((startOfUtcDay(now) - startOfUtcDay(purchased)) / MS_PER_DAY));
}

export function getPlanProgress(userPlan: PlanProgressInput, now = new Date()) {
  const durationDays = getPlanDurationDays(userPlan);
  const principal = userPlan.purchasePrice ?? userPlan.plan.price;
  const dailyReturnPercent =
    userPlan.dailyReturnPercentSnapshot ?? userPlan.plan.dailyReturnPercent;
  const dailyProfit = getDailyProfit(userPlan);
  const elapsedDays = elapsedMiningDays(userPlan.purchasedAt, now);
  const payableDays = Math.min(durationDays, elapsedDays);
  const daysCredited = Math.min(userPlan.daysCredited ?? 0, durationDays);
  const daysToCredit = Math.max(0, payableDays - daysCredited);
  const earningsDue = daysToCredit * dailyProfit;
  const totalEarned = daysCredited * dailyProfit;
  const principalDue = payableDays >= durationDays && !userPlan.principalReturned;

  return {
    principal,
    dailyReturnPercent,
    dailyProfit,
    durationDays,
    elapsedDays,
    payableDays,
    daysCredited,
    daysToCredit,
    earningsDue,
    totalEarned,
    principalDue,
    contributionShare: userPlan.contributionShare ?? null,
    isCompleted: payableDays >= durationDays && Boolean(userPlan.principalReturned),
  };
}

export function getMsUntilMidnightUTC(now = new Date()) {
  const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return midnight.getTime() - now.getTime();
}

export function getTodayAccrualFraction(now = new Date()) {
  const msIntoDay = now.getTime() - startOfUtcDay(now);
  return Math.min(1, msIntoDay / MS_PER_DAY);
}

export function getLivePlanStats(userPlan: PlanProgressInput, now = new Date()) {
  const progress = getPlanProgress(userPlan, now);
  const accrualFraction = getTodayAccrualFraction(now);
  const isAccruingToday =
    progress.payableDays < progress.durationDays &&
    progress.daysCredited >= progress.payableDays;
  const accruingToday = isAccruingToday ? progress.dailyProfit * accrualFraction : 0;
  const liveTotalEarned = progress.totalEarned + progress.earningsDue + accruingToday;

  return {
    ...progress,
    accruingToday,
    liveTotalEarned,
  };
}

export function getLiveAccruingProfit(userPlans: PlanProgressInput[], now = new Date()) {
  return userPlans
    .filter((plan) => plan.isActive !== false)
    .reduce((sum, plan) => sum + getLivePlanStats(plan, now).accruingToday, 0);
}

export function formatCountdown(ms: number) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

/** @deprecated use getPlanDurationDays */
export const PLAN_DURATION_DAYS = DEFAULT_PLAN_DURATION_DAYS;
