"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import MiningMachineVisual from "@/components/MiningMachineVisual";
import { getPooledUserDailyProfit } from "@/lib/plan-pool";
import type { ClientPlan } from "./PlanTypes";

interface PooledPlanCardProps {
  plan: ClientPlan;
  mode?: "landing" | "buy";
  contribution?: string;
  onContributionChange?: (value: string) => void;
  onJoin?: () => void;
}

export default function PooledPlanCard({
  plan,
  mode = "buy",
  contribution = "",
  onContributionChange,
  onJoin,
}: PooledPlanCardProps) {
  const tPlans = useTranslations("plans");
  const tLanding = useTranslations("landing");
  const t = mode === "landing" ? tLanding : tPlans;

  const amount = parseFloat(contribution || "0");
  const min = plan.minContribution ?? 1;
  const estimatedDaily =
    amount >= min && plan.targetPoolAmount
      ? getPooledUserDailyProfit(plan.targetPoolAmount, plan.dailyReturnPercent, amount)
      : null;

  return (
    <div className="plan-card plan-card-pooled flex flex-col h-full group">
      <div className="h-44 sm:h-52 relative">
        <MiningMachineVisual
          name={plan.name}
          imageSrc={plan.machineImage}
          videoSrc={plan.machineVideo}
          online={plan.machineOnline ?? true}
          uptimeHours={plan.machineUptimeHours ?? 0}
          onlineSince={plan.machineOnlineSince}
        />
        <span className="absolute top-3 end-3 z-20 text-xs bg-blue-600/90 text-blue-100 px-2.5 py-1 rounded-full font-semibold backdrop-blur-sm">
          {t("shared")}
        </span>
      </div>
      <div className="p-5 sm:p-6 flex flex-col flex-1">
        <h3 className="text-lg sm:text-xl font-bold text-gradient-gold mb-1">{plan.name}</h3>
        {plan.description && (
          <p className="text-slate-400 text-sm mb-3 line-clamp-2">{plan.description}</p>
        )}

        <div className="bg-slate-900/60 rounded-xl p-3 mb-4 border border-blue-500/20">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400">{t("poolProgress")}</span>
            <span className="text-blue-400 font-bold">{plan.poolProgress?.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-slate-700/80 rounded-full h-2 mb-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-600 to-cyan-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${plan.poolProgress ?? 0}%` }}
            />
          </div>
          <p className="text-xs text-slate-500">
            ${plan.poolFilled?.toLocaleString()} / ${plan.targetPoolAmount?.toLocaleString()}
            {" · "}{plan.poolParticipants} {t("participants")}
          </p>
        </div>

        <div className="space-y-2 text-sm mb-4 flex-1">
          <div className="flex justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400">{t("dailyReturn")}</span>
            <span className="text-emerald-400">{plan.dailyReturnPercent}%</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400">{t("duration")}</span>
            <span className="text-slate-200">{plan.durationDays} {t("days")}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-400">{t("minContribution")}</span>
            <span className="text-amber-400 font-semibold">${plan.minContribution}</span>
          </div>
        </div>

        {mode === "buy" && onContributionChange && (
          <>
            <input
              type="number"
              placeholder={`${t("yourContribution")} (min $${plan.minContribution})`}
              value={contribution}
              onChange={(e) => onContributionChange(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-800/80 border border-slate-600/80 mb-2 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/15 outline-none transition-all"
              step="0.01"
              min={plan.minContribution}
              max={plan.poolRemaining}
            />
            {estimatedDaily != null && (
              <p className="text-sm text-blue-300 mb-3">
                {t("estimatedDaily", { amount: amount.toFixed(2), profit: estimatedDaily.toFixed(2) })}
              </p>
            )}
          </>
        )}

        {mode === "landing" ? (
          <Link href="/register" className="w-full py-3 rounded-xl font-bold text-center text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 transition-all shadow-lg shadow-blue-500/20">
            {t("joinPool")}
          </Link>
        ) : (
          <button
            type="button"
            onClick={onJoin}
            className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 transition-all shadow-lg shadow-blue-500/20"
          >
            {t("joinPool")}
          </button>
        )}
      </div>
    </div>
  );
}
