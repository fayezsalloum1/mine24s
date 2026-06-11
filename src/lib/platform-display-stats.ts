/** Public-facing baseline stats (marketing floor). Real DB totals are added on top. */
export const PLATFORM_USERS_BASE = Number(process.env.PLATFORM_DISPLAY_USERS_BASE ?? 13200);
export const PLATFORM_LIQUIDATION_BASE = Number(
  process.env.PLATFORM_DISPLAY_LIQUIDATION_BASE ?? 17_980_000
);
export const PLATFORM_ACTIVE_PLANS_BASE = Number(
  process.env.PLATFORM_DISPLAY_ACTIVE_PLANS_BASE ?? 10240
);

export const PLATFORM_DISPLAY_DEFAULTS = {
  totalUsers: PLATFORM_USERS_BASE,
  totalLiquidation: PLATFORM_LIQUIDATION_BASE,
  activePlans: PLATFORM_ACTIVE_PLANS_BASE,
} as const;

const USERS_GROWTH_PER_HOUR = 2;
const LIQUIDATION_GROWTH_PER_HOUR = 2_400;
const ACTIVE_PLANS_GROWTH_PER_HOUR = 1;

const EPOCH_MS = new Date("2026-01-01T00:00:00Z").getTime();

function hoursSinceEpoch(now = Date.now()) {
  return Math.max(0, (now - EPOCH_MS) / (1000 * 60 * 60));
}

export function getDisplayUserCount(realUserCount: number, now = Date.now()) {
  const organic = Math.max(0, realUserCount);
  const drift = Math.floor(hoursSinceEpoch(now) * USERS_GROWTH_PER_HOUR);
  return PLATFORM_USERS_BASE + organic + drift;
}

export function getDisplayLiquidation(realConfirmedWithdrawals: number, now = Date.now()) {
  const organic = Math.max(0, realConfirmedWithdrawals);
  const drift = hoursSinceEpoch(now) * LIQUIDATION_GROWTH_PER_HOUR;
  return PLATFORM_LIQUIDATION_BASE + organic + drift;
}

export function getDisplayActivePlans(realActivePlans: number, now = Date.now()) {
  const organic = Math.max(0, realActivePlans);
  const drift = Math.floor(hoursSinceEpoch(now) * ACTIVE_PLANS_GROWTH_PER_HOUR);
  return PLATFORM_ACTIVE_PLANS_BASE + organic + drift;
}

export function formatStatNumber(value: number): string {
  return Math.floor(value).toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export function formatLiquidationUsd(value: number): string {
  return `$${Math.floor(value).toLocaleString("en-US")}`;
}

export function formatLiquidationCompact(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  return formatLiquidationUsd(value);
}
