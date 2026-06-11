"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  formatLiquidationUsd,
  formatStatNumber,
} from "@/lib/platform-display-stats";

type Props = {
  totalUsers: number;
  totalLiquidation: number;
};

function useCountUp(target: number, durationMs = 2200) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const start = Math.max(0, target * 0.92);
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

function useLiveDrift(baseTarget: number, userDrift: boolean) {
  const [extra, setExtra] = useState(0);

  useEffect(() => {
    setExtra(0);
    const intervalMs = userDrift ? 28_000 : 18_000;
    const step = userDrift ? 1 : 127;

    const id = setInterval(() => {
      setExtra((e) => e + step);
    }, intervalMs);

    return () => clearInterval(id);
  }, [baseTarget, userDrift]);

  return baseTarget + extra;
}

export default function PlatformStatsShowcase({ totalUsers, totalLiquidation }: Props) {
  const t = useTranslations("landing");
  const liveUsers = useLiveDrift(totalUsers, true);
  const liveLiquidation = useLiveDrift(totalLiquidation, false);
  const animatedUsers = useCountUp(liveUsers);
  const animatedLiquidation = useCountUp(liveLiquidation, 2600);

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <h2 className="section-title">{t("platformStats")}</h2>
      <p className="text-center text-slate-500 text-sm mb-8 max-w-lg mx-auto">{t("platformStatsHint")}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-3xl mx-auto">
        <div className="stat-card-featured relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/15 transition-colors" />
          <div className="relative z-10 flex flex-col items-center text-center py-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-2xl mb-4">
              👥
            </div>
            <p className="text-4xl sm:text-5xl font-bold text-gradient-gold tabular-nums tracking-tight">
              {formatStatNumber(animatedUsers)}
            </p>
            <p className="text-slate-300 font-semibold mt-3 text-sm sm:text-base">{t("totalUsers")}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400/90 uppercase tracking-wider font-medium">
                {t("liveCounter")}
              </span>
            </div>
          </div>
        </div>

        <div className="stat-card-featured relative overflow-hidden group border-emerald-500/25">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/15 transition-colors" />
          <div className="relative z-10 flex flex-col items-center text-center py-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-2xl mb-4">
              💎
            </div>
            <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-emerald-400 tabular-nums tracking-tight">
              {formatLiquidationUsd(animatedLiquidation)}
            </p>
            <p className="text-slate-300 font-semibold mt-3 text-sm sm:text-base">{t("totalLiquidation")}</p>
            <p className="text-xs text-slate-500 mt-2 max-w-[220px] leading-relaxed">{t("liquidationHint")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
