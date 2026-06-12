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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-2 mb-8 sm:mb-10 relative z-20">
      <div className="iconic-panel p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-0 shadow-iconic">
        <div className="text-center sm:text-start sm:border-e sm:border-white/5 sm:pe-6">
          <p className="iconic-stat-label">Registered Miners</p>
          <p className="iconic-stat-value text-gradient-gold">{formatStatNumber(users)}</p>
        </div>
        <div className="text-center sm:text-start sm:border-e sm:border-white/5 sm:pe-6 sm:ps-6">
          <p className="iconic-stat-label">Active Plans</p>
          <p className="iconic-stat-value text-gradient-cyan">{formatStatNumber(activePlans)}</p>
        </div>
        <div className="text-center sm:text-start sm:ps-6">
          <p className="iconic-stat-label">Total Liquidation</p>
          <p className="iconic-stat-value text-emerald-400 break-all">
            {formatLiquidationUsd(liquidation)}
          </p>
        </div>
      </div>
    </div>
  );
}
