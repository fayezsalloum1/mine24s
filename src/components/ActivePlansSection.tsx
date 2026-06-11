"use client";

import { useTranslations } from "next-intl";
import { getLivePlanStats, formatCountdown } from "@/lib/mining-math";
import { useNow } from "@/hooks/useNow";
import MachineImage from "@/components/MachineImage";
import EmptyState from "@/components/ui/EmptyState";
import Link from "next/link";

interface UserPlan {
  id: string;
  purchasedAt: string;
  isActive: boolean;
  purchasePrice?: number;
  dailyReturnPercentSnapshot?: number;
  durationDaysSnapshot?: number;
  dailyProfitSnapshot?: number;
  contributionShare?: number;
  poolId?: string | null;
  daysCredited?: number;
  principalReturned?: boolean;
  completedAt?: string | null;
  plan: {
    name: string;
    price: number;
    dailyReturnPercent: number;
    durationDays?: number;
    planType?: string;
    machineImage?: string;
  };
}

export default function ActivePlansSection({ userPlans }: { userPlans: UserPlan[] }) {
  const t = useTranslations("dashboard");
  const now = useNow();

  const activePlans = userPlans.filter((p) => p.isActive);

  if (activePlans.length === 0) {
    return (
      <EmptyState
        icon="⛏️"
        title={t("noActivePlans")}
        action={
          <Link href="/plans" className="text-yellow-500 hover:underline text-sm">
            {t("buyPlan")}
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {activePlans.map((up) => {
        const stats = getLivePlanStats(up, now);
        const durationDays = stats.durationDays;
        const planProgress = Math.min(100, (stats.payableDays / durationDays) * 100);
        const isShared = up.plan.planType === "POOLED" || Boolean(up.poolId);

        return (
          <div key={up.id} className="plan-card">
            <div className="h-32 bg-gray-700 flex items-center justify-center overflow-hidden">
              <MachineImage src={up.plan.machineImage} alt={up.plan.name} />
            </div>
            <div className="p-4">
              <div className="flex justify-between items-center gap-2">
                <h3 className="text-lg font-bold text-yellow-500">{up.plan.name}</h3>
                {isShared && (
                  <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded">{t("shared")}</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                <div>
                  <span className="text-gray-400">{t("planPrice")}: </span>
                  <span>${stats.principal.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-400">{t("dailyProfit")}: </span>
                  <span className="text-green-400">${stats.dailyProfit.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-400">{t("daysActive")}: </span>
                  <span>{Math.min(stats.elapsedDays, durationDays)}</span>
                </div>
                <div>
                  <span className="text-gray-400">{t("daysCredited")}: </span>
                  <span>{stats.daysCredited}/{durationDays}</span>
                </div>
                {isShared && stats.contributionShare != null && (
                  <div>
                    <span className="text-gray-400">{t("yourShare")}: </span>
                    <span>{(stats.contributionShare * 100).toFixed(1)}%</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-400">{t("totalEarnedPlan")}: </span>
                  <span className="text-green-400">${stats.liveTotalEarned.toFixed(4)}</span>
                </div>
                <div>
                  <span className="text-gray-400">{t("accruingNow")}: </span>
                  <span className="text-green-300">${stats.accruingToday.toFixed(4)}</span>
                </div>
                <div>
                  <span className="text-gray-400">{t("principalReturn")}: </span>
                  <span>{up.principalReturned ? t("completed") : `$${stats.principal.toFixed(2)}`}</span>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>{t("duration")}: {durationDays} days</span>
                  <span className="text-yellow-500">{stats.payableDays}/{durationDays}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
                  <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${planProgress}%` }} />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>{t("nextPayout")}</span>
                  <span className="font-mono text-yellow-500">{formatCountdown(stats.msUntilPayout)}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full transition-all"
                    style={{ width: `${stats.payoutCycleProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
