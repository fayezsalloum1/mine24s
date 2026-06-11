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
    <div className="bg-gray-800 p-6 rounded-lg">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-gray-400">{t("liveProfitBalance")}</p>
          <p className="text-3xl font-bold text-green-400">${totalLiveProfit.toFixed(4)}</p>
          <p className="text-sm text-gray-500 mt-1">
            {t("accruingNow")}: <span className="text-green-300">${accruingProfit.toFixed(4)}</span>
            {" · "}
            {t("creditedProfit")}: <span className="text-green-300">${creditedProfit.toFixed(2)}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-gray-400 text-sm">{t("nextPayout")}</p>
          <p className="text-2xl font-mono text-yellow-500">{formatCountdown(nextPayoutMs)}</p>
          <p className="text-xs text-gray-500 mt-1">{t("profitUpdatesLive")}</p>
        </div>
      </div>
      {depositBalance > 0.01 && (
        <p className="text-sm text-gray-500 mt-4 border-t border-gray-700 pt-3">
          {t("depositBalance")}: <span className="text-yellow-500">${depositBalance.toFixed(2)}</span>
          {" "}({t("notWithdrawable")})
        </p>
      )}
    </div>
  );
}
