"use client";

import { formatLiquidationUsd, formatStatNumber, PLATFORM_DISPLAY_DEFAULTS } from "@/lib/platform-display-stats";

type Props = {
  users: number;
  activePlans: number;
  liquidation: number;
};

/** Compact stats strip shown immediately under the hero */
export default function HeroStatsStrip({
  users = PLATFORM_DISPLAY_DEFAULTS.totalUsers,
  activePlans = PLATFORM_DISPLAY_DEFAULTS.activePlans,
  liquidation = PLATFORM_DISPLAY_DEFAULTS.totalLiquidation,
}: Props) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-2 mb-6 sm:mb-8 relative z-20">
      <div className="glass-panel rounded-2xl p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 shadow-panel">
        <div className="text-center sm:text-start sm:border-e sm:border-slate-700/50 sm:pe-4">
          <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider mb-1">Registered Miners</p>
          <p className="text-xl sm:text-2xl font-bold text-gradient-gold tabular-nums">{formatStatNumber(users)}</p>
        </div>
        <div className="text-center sm:text-start sm:border-e sm:border-slate-700/50 sm:pe-4">
          <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider mb-1">Active Plans</p>
          <p className="text-xl sm:text-2xl font-bold text-cyan-400 tabular-nums">{formatStatNumber(activePlans)}</p>
        </div>
        <div className="text-center sm:text-start">
          <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider mb-1">Total Liquidation</p>
          <p className="text-xl sm:text-2xl font-bold text-emerald-400 tabular-nums break-all">
            {formatLiquidationUsd(liquidation)}
          </p>
        </div>
      </div>
    </div>
  );
}
