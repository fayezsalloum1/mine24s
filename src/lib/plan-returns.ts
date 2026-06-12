import { PAYOUT_INTERVAL_DAYS } from "./mining-math";

/** Total mining profit over the full plan duration (daily × days). */
export function getTotalMiningProfit(dailyProfit: number, durationDays: number) {
  return dailyProfit * durationDays;
}

/** Principal + all mining profit — what the investor receives in total. */
export function getTotalReturn(principal: number, dailyProfit: number, durationDays: number) {
  return principal + getTotalMiningProfit(dailyProfit, durationDays);
}

/** ROI on mining profit only (excludes principal return since it's 100% of investment). */
export function getMiningRoiPercent(principal: number, dailyProfit: number, durationDays: number) {
  if (principal <= 0) return 0;
  return (getTotalMiningProfit(dailyProfit, durationDays) / principal) * 100;
}

export function getPeriodPayoutAmount(dailyProfit: number) {
  return dailyProfit * PAYOUT_INTERVAL_DAYS;
}

/** Full 10-day payout cycles within the plan (remainder credited at completion). */
export function getPeriodPayoutCount(durationDays: number) {
  return Math.floor(durationDays / PAYOUT_INTERVAL_DAYS);
}

export type PlanReturnProjection = {
  principal: number;
  dailyProfit: number;
  durationDays: number;
  dailyReturnPercent: number;
  totalMiningProfit: number;
  totalReturn: number;
  roiPercent: number;
  periodPayoutAmount: number;
  periodPayoutCount: number;
};

export function getPlanReturnProjection(
  principal: number,
  dailyReturnPercent: number,
  durationDays: number,
  dailyProfitOverride?: number
): PlanReturnProjection {
  const dailyProfit =
    dailyProfitOverride ?? (principal * dailyReturnPercent) / 100;
  const totalMiningProfit = getTotalMiningProfit(dailyProfit, durationDays);

  return {
    principal,
    dailyProfit,
    durationDays,
    dailyReturnPercent,
    totalMiningProfit,
    totalReturn: principal + totalMiningProfit,
    roiPercent: getMiningRoiPercent(principal, dailyProfit, durationDays),
    periodPayoutAmount: getPeriodPayoutAmount(dailyProfit),
    periodPayoutCount: getPeriodPayoutCount(durationDays),
  };
}
