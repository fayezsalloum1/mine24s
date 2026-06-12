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
    <div className="stat-card-featured relative mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-profit animate-pulse" />
            <p className="iconic-stat-label mb-0">{t("liveProfitBalance")}</p>
          </div>
          <p className="text-3xl sm:text-5xl font-bold text-profit glow-profit tabular-nums">
            ${totalLiveProfit.toFixed(4)}
          </p>
          <p className="text-xs sm:text-sm text-gray-500 mt-2">
            {t("accruingNow")}: <span className="text-profit">${accruingProfit.toFixed(4)}</span>
            {" · "}
            {t("creditedProfit")}: <span className="text-profit">${creditedProfit.toFixed(2)}</span>
          </p>
        </div>
        <div className="glass-card px-4 py-3 sm:bg-transparent sm:border-0 sm:p-0 sm:shadow-none">
          <p className="iconic-stat-label mb-0">{t("nextPayout")}</p>
          <p className="text-2xl sm:text-3xl font-bold text-gold-400 tabular-nums">{formatCountdown(nextPayoutMs)}</p>
          <p className="text-xs text-gray-500 mt-1">{t("profitUpdatesLive")}</p>
        </div>
      </div>
      {depositBalance > 0.01 && (
        <p className="text-sm text-gray-500 mt-4 border-t border-gray-800 pt-3">
          {t("depositBalance")}: <span className="text-gold-400 font-semibold">${depositBalance.toFixed(2)}</span>
          {" "}({t("notWithdrawable")})
        </p>
      )}
    </div>
  );
}
