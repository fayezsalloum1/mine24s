"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { getLiveAccruingProfit, getSoonestPlanPayoutMs, formatCountdown } from "@/lib/mining-math";
import { useNow } from "@/hooks/useNow";

interface UserPlan {
  purchasedAt: string;
  isActive: boolean;
  purchasePrice?: number;
  dailyReturnPercentSnapshot?: number;
  durationDaysSnapshot?: number;
  daysCredited?: number;
  principalReturned?: boolean;
  plan: {
    price: number;
    dailyReturnPercent: number;
    durationDays?: number;
  };
}

interface LiveProfitCardProps {
  creditedProfit: number;
  balance: number;
  userPlans: UserPlan[];
}

export default function LiveProfitCard({ creditedProfit, balance, userPlans }: LiveProfitCardProps) {
  const t = useTranslations("dashboard");
  const now = useNow();

  const activePlans = useMemo(() => userPlans.filter((p) => p.isActive), [userPlans]);
  const accruingProfit = useMemo(
    () => getLiveAccruingProfit(activePlans, now),
    [activePlans, now]
  );
  const nextPayoutMs = useMemo(
    () => getSoonestPlanPayoutMs(activePlans, now),
    [activePlans, now]
  );

  const totalLiveProfit = creditedProfit + accruingProfit;
  const depositBalance = Math.max(0, balance - creditedProfit);

  return (
    <div className="stat-card-featured relative">
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-slate-400 text-sm uppercase tracking-wide">{t("liveProfitBalance")}</p>
          </div>
          <p className="text-3xl sm:text-4xl font-bold text-emerald-400 tabular-nums">
            ${totalLiveProfit.toFixed(4)}
          </p>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            {t("accruingNow")}: <span className="text-emerald-300">${accruingProfit.toFixed(4)}</span>
            <span className="hidden sm:inline">{" · "}</span>
            <span className="block sm:inline mt-0.5 sm:mt-0">
              {t("creditedProfit")}: <span className="text-emerald-300">${creditedProfit.toFixed(2)}</span>
            </span>
          </p>
        </div>
        <div className="sm:text-right bg-slate-900/40 rounded-xl px-4 py-3 sm:bg-transparent sm:p-0 border border-slate-700/40 sm:border-0">
          <p className="text-slate-400 text-xs uppercase tracking-wide">{t("nextPayout")}</p>
          <p className="text-2xl sm:text-3xl font-mono text-amber-400 tabular-nums">{formatCountdown(nextPayoutMs)}</p>
          <p className="text-xs text-slate-500 mt-1">{t("profitUpdatesLive")}</p>
        </div>
      </div>
      {depositBalance > 0.01 && (
        <p className="relative z-10 text-sm text-slate-500 mt-4 border-t border-slate-700/60 pt-3">
          {t("depositBalance")}: <span className="text-amber-400 font-semibold">${depositBalance.toFixed(2)}</span>
          {" "}({t("notWithdrawable")})
        </p>
      )}
    </div>
  );
}
