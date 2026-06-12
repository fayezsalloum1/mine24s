"use client";

import { formatLiquidationUsd, formatStatNumber, PLATFORM_DISPLAY_DEFAULTS } from "@/lib/platform-display-stats";
import { useTranslations } from "next-intl";

type Props = {
  users: number;
  activePlans: number;
  liquidation: number;
};

export default function HeroStatsStrip({
  users = PLATFORM_DISPLAY_DEFAULTS.totalUsers,
  activePlans = PLATFORM_DISPLAY_DEFAULTS.activePlans,
  liquidation = PLATFORM_DISPLAY_DEFAULTS.totalLiquidation,
}: Props) {
  const t = useTranslations("landing");

  const items = [
    { label: t("statTotalUsers"), value: formatStatNumber(users), accent: "text-gold-400 glow-gold" },
    { label: t("statTotalPaid"), value: formatLiquidationUsd(liquidation), accent: "text-profit glow-profit" },
    { label: t("statDailyReturns"), value: "Up to 3.5%", accent: "text-gray-100" },
    { label: t("statUptime"), value: "99.9%", accent: "text-gray-100" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-4 mb-12 sm:mb-16 relative z-20">
      <div className="stats-bar">
        {items.map((item) => (
          <div key={item.label} className="stats-bar-item">
            <p className="iconic-stat-label">{item.label}</p>
            <p className={`text-xl sm:text-2xl font-bold tabular-nums ${item.accent}`}>{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
