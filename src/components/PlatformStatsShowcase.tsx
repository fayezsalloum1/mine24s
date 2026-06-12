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

function useLiveDrift(baseTarget: number, step: number, intervalMs: number) {
  const [extra, setExtra] = useState(0);

  useEffect(() => {
    setExtra(0);
    const id = setInterval(() => setExtra((e) => e + step), intervalMs);
    return () => clearInterval(id);
  }, [baseTarget, step, intervalMs]);

  return baseTarget + extra;
}

export default function PlatformStatsShowcase({
  totalUsers = PLATFORM_DISPLAY_DEFAULTS.totalUsers,
  totalLiquidation = PLATFORM_DISPLAY_DEFAULTS.totalLiquidation,
  activePlans = PLATFORM_DISPLAY_DEFAULTS.activePlans,
}: Props) {
  const t = useTranslations("landing");

  const liveUsers = useLiveDrift(totalUsers, 1, 30_000);
  const livePlans = useLiveDrift(activePlans, 1, 45_000);
  const liveLiquidation = useLiveDrift(totalLiquidation, 215, 12_000);

  const animatedUsers = useCountUp(liveUsers);
  const animatedPlans = useCountUp(livePlans, 2000);
  const animatedLiquidation = useCountUp(liveLiquidation, 2800);

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <div className="section-eyebrow">
        <span className="text-xs font-bold uppercase tracking-widest2 text-amber-400/80">{t("platformStats")}</span>
      </div>
      <h2 className="section-title">{t("platformStats")}</h2>
      <p className="section-subtitle">{t("platformStatsHint")}</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 max-w-5xl mx-auto">
        {/* Users */}
        <div className="stat-card text-center py-7 sm:py-9 relative overflow-visible">
          <div className="step-icon-wrap w-12 h-12 mb-4 mx-auto text-lg">
            👥
          </div>
          <p className="text-3xl sm:text-4xl font-black text-gradient-gold tabular-nums leading-none">
            {formatStatNumber(animatedUsers)}
          </p>
          <p className="text-slate-300 font-semibold mt-3 text-sm">{t("totalUsers")}</p>
          <span className="inline-flex items-center gap-1.5 mt-2.5 iconic-badge iconic-badge-live text-[9px] py-1 px-2.5">
            {t("liveCounter")}
          </span>
        </div>

        {/* Active plans */}
        <div className="stat-card text-center py-7 sm:py-9 relative overflow-visible">
          <div className="step-icon-wrap w-12 h-12 mb-4 mx-auto text-lg border-cyan-500/25 bg-cyan-500/10">
            ⛏️
          </div>
          <p className="text-3xl sm:text-4xl font-black text-gradient-cyan tabular-nums leading-none">
            {formatStatNumber(animatedPlans)}
          </p>
          <p className="text-slate-300 font-semibold mt-3 text-sm">{t("activePlans")}</p>
          <span className="inline-block mt-2.5 text-[10px] text-cyan-400/80 uppercase font-bold tracking-widest">
            {t("miningNow")}
          </span>
        </div>

        {/* Total liquidation */}
        <div className="stat-card-featured text-center py-7 sm:py-9 relative overflow-visible sm:col-span-1 col-span-1">
          <div className="step-icon-wrap w-12 h-12 mb-4 mx-auto text-lg border-emerald-500/25 bg-emerald-500/10">
            💰
          </div>
          <p
            className="font-black text-emerald-400 tabular-nums leading-tight break-words px-1"
            style={{ fontSize: "clamp(1.35rem, 4.5vw, 2.25rem)" }}
          >
            {formatLiquidationUsd(animatedLiquidation)}
          </p>
          <p className="text-slate-200 font-semibold mt-3 text-sm">{t("totalLiquidation")}</p>
          <p className="text-[11px] text-slate-500 mt-1.5 px-2 leading-snug">{t("liquidationHint")}</p>
        </div>
      </div>
    </section>
  );
}
