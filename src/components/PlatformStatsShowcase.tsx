"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  formatLiquidationUsd,
  formatStatNumber,
  PLATFORM_DISPLAY_DEFAULTS,
} from "@/lib/platform-display-stats";

type Props = {
  totalUsers: number;
  totalLiquidation: number;
  activePlans: number;
};

function useCountUp(target: number, durationMs = 2200) {
  const [value, setValue] = useState(target);
  useEffect(() => {
    const start = Math.max(0, target * 0.94);
    const startTime = performance.now();
    let frame: number;
    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(start + (target - start) * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
      else setValue(target);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);
  return value;
}

export default function PlatformStatsShowcase({
  totalUsers = PLATFORM_DISPLAY_DEFAULTS.totalUsers,
  totalLiquidation = PLATFORM_DISPLAY_DEFAULTS.totalLiquidation,
  activePlans = PLATFORM_DISPLAY_DEFAULTS.activePlans,
}: Props) {
  const t = useTranslations("landing");
  const animatedUsers = useCountUp(totalUsers);
  const animatedPlans = useCountUp(activePlans, 2000);
  const animatedLiquidation = useCountUp(totalLiquidation, 2800);

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <h2 className="section-title">{t("platformStats")}</h2>
      <p className="section-subtitle">{t("platformStatsHint")}</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="stat-card text-center py-8">
          <p className="text-3xl sm:text-4xl font-bold text-gold-400 glow-gold tabular-nums">
            {formatStatNumber(animatedUsers)}
          </p>
          <p className="text-gray-300 font-medium mt-2 text-sm">{t("totalUsers")}</p>
          <span className="inline-flex items-center gap-1.5 mt-2 text-xs text-profit">
            <span className="w-1.5 h-1.5 rounded-full bg-profit animate-pulse" />
            {t("liveCounter")}
          </span>
        </div>

        <div className="stat-card text-center py-8">
          <p className="text-3xl sm:text-4xl font-bold text-profit glow-profit tabular-nums">
            {formatStatNumber(animatedPlans)}
          </p>
          <p className="text-gray-300 font-medium mt-2 text-sm">{t("activePlans")}</p>
          <span className="text-xs text-gray-500 mt-2 block">{t("miningNow")}</span>
        </div>

        <div className="stat-card-featured text-center py-8">
          <p className="text-2xl sm:text-3xl font-bold text-profit glow-profit tabular-nums break-words px-2">
            {formatLiquidationUsd(animatedLiquidation)}
          </p>
          <p className="text-gray-200 font-medium mt-2 text-sm">{t("totalLiquidation")}</p>
          <p className="text-xs text-gray-500 mt-1.5 px-2">{t("liquidationHint")}</p>
        </div>
      </div>
    </section>
  );
}
