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

function toDate(value: Date | string) {
  return typeof value === "string" ? new Date(value) : value;
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

/** Full 24-hour periods elapsed since purchase (not UTC midnight). */
export function elapsedMiningDays(purchasedAt: Date | string, now = new Date()) {
  const purchased = toDate(purchasedAt);
  return Math.max(0, Math.floor((now.getTime() - purchased.getTime()) / MS_PER_DAY));
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

/** Start of the current in-progress 24h accrual window (from purchase time). */
export function getAccrualPeriodStartMs(
  purchasedAt: Date | string,
  daysCredited: number,
  payableDays: number
) {
  const purchased = toDate(purchasedAt);
  const periodIndex = Math.max(daysCredited, payableDays);
  return purchased.getTime() + periodIndex * MS_PER_DAY;
}

/** Fraction of the current 24h period elapsed (0–1). */
export function getCurrentPeriodAccrualFraction(
  purchasedAt: Date | string,
  daysCredited: number,
  payableDays: number,
  durationDays: number,
  now = new Date()
) {
  if (daysCredited >= durationDays) return 0;
  const periodStart = getAccrualPeriodStartMs(purchasedAt, daysCredited, payableDays);
  if (now.getTime() < periodStart) return 0;
  const elapsed = now.getTime() - periodStart;
  return Math.min(1, elapsed / MS_PER_DAY);
}

/** Ms until the next payout for this plan (0 if overdue or complete). */
export function getMsUntilNextPlanPayout(
  purchasedAt: Date | string,
  daysCredited: number,
  payableDays: number,
  durationDays: number,
  now = new Date()
) {
  if (daysCredited >= durationDays) return 0;
  if (daysCredited < payableDays) return 0;
  const purchased = toDate(purchasedAt);
  const nextPayoutAt = purchased.getTime() + (daysCredited + 1) * MS_PER_DAY;
  return Math.max(0, nextPayoutAt - now.getTime());
}

/** Progress through the current 24h payout cycle (0–100). */
export function getPlanPayoutCycleProgress(
  purchasedAt: Date | string,
  daysCredited: number,
  payableDays: number,
  durationDays: number,
  now = new Date()
) {
  if (daysCredited >= durationDays) return 100;
  const fraction = getCurrentPeriodAccrualFraction(
    purchasedAt,
    daysCredited,
    payableDays,
    durationDays,
    now
  );
  return fraction * 100;
}

export function getSoonestPlanPayoutMs(userPlans: PlanProgressInput[], now = new Date()) {
  const active = userPlans.filter((plan) => plan.isActive !== false);
  if (active.length === 0) return 0;

  return Math.min(
    ...active.map((plan) => {
      const progress = getPlanProgress(plan, now);
      return getMsUntilNextPlanPayout(
        plan.purchasedAt,
        progress.daysCredited,
        progress.payableDays,
        progress.durationDays,
        now
      );
    })
  );
}

export function getLivePlanStats(userPlan: PlanProgressInput, now = new Date()) {
  const progress = getPlanProgress(userPlan, now);
  const accrualFraction = getCurrentPeriodAccrualFraction(
    userPlan.purchasedAt,
    progress.daysCredited,
    progress.payableDays,
    progress.durationDays,
    now
  );
  const isAccruing =
    progress.daysCredited < progress.durationDays && userPlan.isActive !== false;
  const accruingToday = isAccruing ? progress.dailyProfit * accrualFraction : 0;
  const liveTotalEarned = progress.totalEarned + progress.earningsDue + accruingToday;
  const msUntilPayout = getMsUntilNextPlanPayout(
    userPlan.purchasedAt,
    progress.daysCredited,
    progress.payableDays,
    progress.durationDays,
    now
  );
  const payoutCycleProgress = getPlanPayoutCycleProgress(
    userPlan.purchasedAt,
    progress.daysCredited,
    progress.payableDays,
    progress.durationDays,
    now
  );

  return {
    ...progress,
    accruingToday,
    liveTotalEarned,
    msUntilPayout,
    payoutCycleProgress,
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
