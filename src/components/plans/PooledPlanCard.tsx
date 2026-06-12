"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import MiningMachineVisual from "@/components/MiningMachineVisual";
import PlanReturnsBreakdown from "@/components/plans/PlanReturnsBreakdown";
import { getPooledUserDailyProfit, PAYOUT_INTERVAL_DAYS } from "@/lib/mining-math";
import { getPlanReturnProjection } from "@/lib/plan-returns";
import type { ClientPlan } from "./PlanTypes";

interface PooledPlanCardProps {
  plan: ClientPlan;
  mode?: "landing" | "buy";
  contribution?: string;
  onContributionChange?: (value: string) => void;
  onJoin?: () => void;
  loading?: boolean;
}

export default function PooledPlanCard({
  plan,
  mode = "buy",
  contribution = "",
  onContributionChange,
  onJoin,
  loading = false,
}: PooledPlanCardProps) {
  const tPlans = useTranslations("plans");
  const tLanding = useTranslations("landing");
  const t = mode === "landing" ? tLanding : tPlans;

  const amount = parseFloat(contribution || "0");
  const min = plan.minContribution ?? 1;
  const poolFull = (plan.poolProgress ?? 0) >= 100;
  const projectionPrincipal =
    mode === "buy" && amount >= min ? amount : min;
  const estimatedDaily =
    projectionPrincipal >= min && plan.targetPoolAmount
      ? getPooledUserDailyProfit(plan.targetPoolAmount, plan.dailyReturnPercent, projectionPrincipal)
      : null;
  const projection =
    estimatedDaily != null
      ? getPlanReturnProjection(
          projectionPrincipal,
          plan.dailyReturnPercent,
          plan.durationDays,
          estimatedDaily
        )
      : null;

  return (
    <div className="plan-card plan-card-pooled flex flex-col h-full">
      <div className="h-44 sm:h-52 relative">
        <MiningMachineVisual
          name={plan.name}
          imageSrc={plan.machineImage}
          videoSrc={plan.machineVideo}
          online={plan.machineOnline ?? true}
          uptimeHours={plan.machineUptimeHours ?? 0}
          onlineSince={plan.machineOnlineSince}
        />
        <span className="absolute top-3 end-3 z-20 text-xs bg-blue-600/90 text-blue-100 px-2.5 py-1 rounded-full font-semibold">
          {t("shared")}
        </span>
      </div>
      <div className="p-5 sm:p-6 flex flex-col flex-1">
        <h3 className="text-lg font-bold text-gray-100 mb-1">{plan.name}</h3>
        {plan.description && (
          <p className="text-gray-400 text-sm mb-3 line-clamp-2">{plan.description}</p>
        )}

        <div className="bg-navy-900/60 rounded-lg p-3 mb-4 border border-gray-800">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">{t("poolProgress")}</span>
            <span className="text-blue-400 font-bold">{plan.poolProgress?.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2 mb-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-600 to-profit h-2 rounded-full transition-all duration-500"
              style={{ width: `${plan.poolProgress ?? 0}%` }}
            />
          </div>
          <p className="text-xs text-gray-500">
            ${plan.poolFilled?.toLocaleString()} / ${plan.targetPoolAmount?.toLocaleString()}
            {" · "}{plan.poolParticipants} {t("participants")}
          </p>
        </div>

        {projection && (
          <div className="mb-4">
            {mode === "landing" && (
              <p className="text-xs text-blue-400/90 mb-2">
                {t("returnsBasedOnMin", { amount: projectionPrincipal.toFixed(0) })}
              </p>
            )}
            <PlanReturnsBreakdown
              projection={projection}
              isPooled
              poolProgress={plan.poolProgress}
              poolActive={poolFull}
            />
          </div>
        )}

        <div className="space-y-2 text-sm mb-4 flex-1">
          <div className="flex justify-between py-1 border-b border-gray-800">
            <span className="text-gray-400">{t("dailyReturn")}</span>
            <span className="text-profit font-semibold">{plan.dailyReturnPercent}%</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-gray-400">{t("minContribution")}</span>
            <span className="text-gold-400 font-semibold">${plan.minContribution}</span>
          </div>
        </div>

        {mode === "buy" && onContributionChange && (
          <>
            <input
              type="number"
              placeholder={`${t("yourContribution")} (min $${plan.minContribution})`}
              value={contribution}
              onChange={(e) => onContributionChange(e.target.value)}
              className="form-input mb-2"
              step="0.01"
              min={plan.minContribution}
              max={plan.poolRemaining}
            />
            {estimatedDaily != null && (
              <div className="mb-3 p-2 rounded-lg bg-profit/5 border border-profit/15">
                <p className="text-sm text-profit font-bold">${estimatedDaily.toFixed(2)} / day</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {t("payoutEvery")}: ${(estimatedDaily * PAYOUT_INTERVAL_DAYS).toFixed(2)}
                </p>
              </div>
            )}
          </>
        )}

        {mode === "landing" ? (
          <Link href="/register" className="w-full btn-primary py-3 rounded-lg text-center">
            {t("joinPool")}
          </Link>
        ) : (
          <button
            type="button"
            onClick={onJoin}
            disabled={loading}
            className="w-full btn-primary py-3 rounded-lg disabled:opacity-60"
          >
            {loading && (
              <span className="inline-block w-4 h-4 border-2 border-navy-900/30 border-t-navy-900 rounded-full animate-spin" />
            )}
            {t("joinPool")}
          </button>
        )}
      </div>
    </div>
  );
}
