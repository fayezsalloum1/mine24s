export const DEFAULT_PLAN_DURATION_DAYS = 100;
/** Mining profits are credited every N days (not daily). */
export const PAYOUT_INTERVAL_DAYS = 10;

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

export function getPeriodPayoutAmount(userPlan: PlanProgressInput) {
  return getDailyProfit(userPlan) * PAYOUT_INTERVAL_DAYS;
}

/** Solo plan daily profit from price and return %. Safe for client components. */
export function getSoloDailyProfit(price: number, dailyReturnPercent: number) {
  return (price * dailyReturnPercent) / 100;
}

/** User's share of pooled plan daily profit. Safe for client components. */
export function getPooledUserDailyProfit(
  targetAmount: number,
  dailyReturnPercent: number,
  contribution: number
) {
  const poolDailyProfit = (targetAmount * dailyReturnPercent) / 100;
  return poolDailyProfit * (contribution / targetAmount);
}

/** Full 24-hour periods elapsed since purchase (not UTC midnight). */
export function elapsedMiningDays(purchasedAt: Date | string, now = new Date()) {
  const purchased = toDate(purchasedAt);
  return Math.max(0, Math.floor((now.getTime() - purchased.getTime()) / MS_PER_DAY));
}

function getCurrentPayoutPeriodStartDay(daysCredited: number) {
  return Math.floor(daysCredited / PAYOUT_INTERVAL_DAYS) * PAYOUT_INTERVAL_DAYS;
}

function computeDaysToCredit(payableDays: number, daysCredited: number, durationDays: number) {
  const uncreditedDays = payableDays - daysCredited;
  if (uncreditedDays <= 0) return 0;

  if (uncreditedDays >= PAYOUT_INTERVAL_DAYS) {
    return Math.floor(uncreditedDays / PAYOUT_INTERVAL_DAYS) * PAYOUT_INTERVAL_DAYS;
  }

  if (payableDays >= durationDays) {
    return uncreditedDays;
  }

  return 0;
}

export function getPlanProgress(userPlan: PlanProgressInput, now = new Date()) {
  const durationDays = getPlanDurationDays(userPlan);
  const principal = userPlan.purchasePrice ?? userPlan.plan.price;
  const dailyReturnPercent =
    userPlan.dailyReturnPercentSnapshot ?? userPlan.plan.dailyReturnPercent;
  const dailyProfit = getDailyProfit(userPlan);
  const periodPayout = dailyProfit * PAYOUT_INTERVAL_DAYS;
  const elapsedDays = elapsedMiningDays(userPlan.purchasedAt, now);
  const payableDays = Math.min(durationDays, elapsedDays);
  const daysCredited = Math.min(userPlan.daysCredited ?? 0, durationDays);
  const daysToCredit = computeDaysToCredit(payableDays, daysCredited, durationDays);
  const earningsDue = daysToCredit * dailyProfit;
  const totalEarned = daysCredited * dailyProfit;
  const principalDue = payableDays >= durationDays && !userPlan.principalReturned;

  return {
    principal,
    dailyReturnPercent,
    dailyProfit,
    periodPayout,
    payoutIntervalDays: PAYOUT_INTERVAL_DAYS,
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

/** Start of the current accrual window (toward next interval payout). */
export function getAccrualPeriodStartMs(
  purchasedAt: Date | string,
  daysCredited: number,
  _payableDays: number
) {
  const purchased = toDate(purchasedAt);
  const periodStartDay = getCurrentPayoutPeriodStartDay(daysCredited);
  return purchased.getTime() + periodStartDay * MS_PER_DAY;
}

/** Fraction of the current payout interval elapsed (0–1). */
export function getCurrentPeriodAccrualFraction(
  purchasedAt: Date | string,
  daysCredited: number,
  payableDays: number,
  durationDays: number,
  now = new Date()
) {
  if (daysCredited >= durationDays) return 0;

  const periodStartDay = getCurrentPayoutPeriodStartDay(daysCredited);
  if (periodStartDay >= durationDays) return 0;

  const periodStart = getAccrualPeriodStartMs(purchasedAt, daysCredited, payableDays);
  if (now.getTime() < periodStart) return 0;

  const elapsed = now.getTime() - periodStart;
  return Math.min(1, elapsed / (PAYOUT_INTERVAL_DAYS * MS_PER_DAY));
}

/** Ms until the next interval payout for this plan (0 if overdue or complete). */
export function getMsUntilNextPlanPayout(
  purchasedAt: Date | string,
  daysCredited: number,
  payableDays: number,
  durationDays: number,
  now = new Date()
) {
  if (daysCredited >= durationDays) return 0;

  const purchased = toDate(purchasedAt);
  const nextPayoutDay = getCurrentPayoutPeriodStartDay(daysCredited) + PAYOUT_INTERVAL_DAYS;

  if (nextPayoutDay > durationDays) {
    if (payableDays >= durationDays) {
      return Math.max(0, purchased.getTime() + durationDays * MS_PER_DAY - now.getTime());
    }
    return 0;
  }

  if (payableDays >= nextPayoutDay) return 0;

  const nextPayoutAt = purchased.getTime() + nextPayoutDay * MS_PER_DAY;
  return Math.max(0, nextPayoutAt - now.getTime());
}

/** Progress through the current payout interval (0–100). */
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
  const accruingInPeriod = isAccruing
    ? progress.periodPayout * accrualFraction
    : 0;
  const liveTotalEarned = progress.totalEarned + progress.earningsDue + accruingInPeriod;
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
    accruingToday: accruingInPeriod,
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
  const d = Math.floor(ms / (24 * 60 * 60 * 1000));
  const h = Math.floor((ms % (24 * 60 * 60 * 1000)) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (d > 0) {
    return `${d}d ${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

/** @deprecated use getPlanDurationDays */
export const PLAN_DURATION_DAYS = DEFAULT_PLAN_DURATION_DAYS;
