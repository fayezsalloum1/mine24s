"use client";

import { useTranslations } from "next-intl";
import { getLivePlanStats, formatCountdown } from "@/lib/mining-math";
import { getTotalReturn } from "@/lib/plan-returns";
import { useNow } from "@/hooks/useNow";
import MiningMachineVisual from "@/components/MiningMachineVisual";
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
    machineVideo?: string | null;
    machineOnline?: boolean;
    machineUptimeHours?: number;
    machineOnlineSince?: string | null;
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
        const daysUntilPrincipal = Math.max(0, durationDays - stats.payableDays);
        const projectedTotal = getTotalReturn(stats.principal, stats.dailyProfit, durationDays);

        return (
          <div key={up.id} className="plan-card">
            <div className="h-36 sm:h-40 relative">
              <MiningMachineVisual
                name={up.plan.name}
                imageSrc={up.plan.machineImage}
                videoSrc={up.plan.machineVideo}
                online={up.plan.machineOnline ?? up.isActive}
                uptimeHours={up.plan.machineUptimeHours ?? 0}
                onlineSince={up.plan.machineOnlineSince}
                compact
              />
            </div>
            <div className="p-4 sm:p-5">
              <div className="flex justify-between items-center gap-2 mb-3">
                <h3 className="text-base sm:text-lg font-bold text-gradient-gold">{up.plan.name}</h3>
                {isShared && (
                  <span className="text-xs bg-blue-600/80 text-blue-200 px-2 py-0.5 rounded-full">{t("shared")}</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs sm:text-sm">
                <div>
                  <span className="text-slate-500">{t("planPrice")}: </span>
                  <span className="text-slate-200">${stats.principal.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-500">{t("dailyProfit")}: </span>
                  <span className="text-emerald-400">${stats.dailyProfit.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-500">{t("payoutEvery")}: </span>
                  <span className="text-amber-400 font-semibold">${stats.periodPayout.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-500">{t("daysActive")}: </span>
                  <span>{Math.min(stats.elapsedDays, durationDays)}</span>
                </div>
                <div>
                  <span className="text-slate-500">{t("daysCredited")}: </span>
                  <span>{stats.daysCredited}/{durationDays}</span>
                </div>
                {isShared && stats.contributionShare != null && (
                  <div>
                    <span className="text-slate-500">{t("yourShare")}: </span>
                    <span>{(stats.contributionShare * 100).toFixed(1)}%</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-500">{t("totalEarnedPlan")}: </span>
                  <span className="text-emerald-400">${stats.liveTotalEarned.toFixed(4)}</span>
                </div>
                <div>
                  <span className="text-slate-500">{t("accruingNow")}: </span>
                  <span className="text-emerald-300">${stats.accruingToday.toFixed(4)}</span>
                </div>
                <div>
                  <span className="text-slate-500">{t("principalReturn")}: </span>
                  <span className="text-gold-400 font-semibold">
                    {up.principalReturned
                      ? t("completed")
                      : t("principalReturnPending", {
                          amount: stats.principal.toFixed(2),
                          days: daysUntilPrincipal,
                        })}
                  </span>
                </div>
                <div className="col-span-2 pt-1 border-t border-slate-800/40">
                  <span className="text-slate-500">{t("projectedTotalReturn")}: </span>
                  <span className="text-gold-400 font-bold">${projectedTotal.toFixed(2)}</span>
                  <span className="text-slate-600 text-xs ms-1">({t("includesPrincipal")})</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/60">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>{t("duration")}: {durationDays} days</span>
                  <span className="text-amber-400">{stats.payableDays}/{durationDays}</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 mb-3 overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-1.5 rounded-full transition-all" style={{ width: `${planProgress}%` }} />
                </div>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>{t("nextPayout")}</span>
                  <span className="font-mono text-amber-400">{formatCountdown(stats.msUntilPayout)}</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-600 to-amber-400 h-1.5 rounded-full transition-all"
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
