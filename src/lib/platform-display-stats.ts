/** Public-facing baseline stats (marketing floor). Real DB totals are added on top. */
export const PLATFORM_USERS_BASE = Number(process.env.PLATFORM_DISPLAY_USERS_BASE ?? 10299);
export const PLATFORM_LIQUIDATION_BASE = Number(
  process.env.PLATFORM_DISPLAY_LIQUIDATION_BASE ?? 5_498_900
);

/** Subtle live growth so counters feel active (per hour). */
const USERS_GROWTH_PER_HOUR = 3;
const LIQUIDATION_GROWTH_PER_HOUR = 1_850;

const EPOCH_MS = new Date("2026-01-01T00:00:00Z").getTime();

function hoursSinceEpoch(now = Date.now()) {
  return Math.max(0, (now - EPOCH_MS) / (1000 * 60 * 60));
}

export function getDisplayUserCount(realUserCount: number, now = Date.now()) {
  const organic = Math.max(0, realUserCount);
  const drift = Math.floor(hoursSinceEpoch(now) * USERS_GROWTH_PER_HOUR);
  return PLATFORM_USERS_BASE + organic + drift;
}

export function getDisplayLiquidation(
  realConfirmedWithdrawals: number,
  now = Date.now()
) {
  const organic = Math.max(0, realConfirmedWithdrawals);
  const drift = hoursSinceEpoch(now) * LIQUIDATION_GROWTH_PER_HOUR;
  return PLATFORM_LIQUIDATION_BASE + organic + drift;
}

export function formatStatNumber(value: number): string {
  return Math.floor(value).toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function formatLiquidationUsd(value: number): string {
  return Math.floor(value).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}
