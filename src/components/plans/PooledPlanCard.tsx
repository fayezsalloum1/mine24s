"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import MachineImage from "@/components/MachineImage";
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
    <div className="plan-card plan-card-pooled flex flex-col h-full">
      <div className="h-48 bg-gray-800/50 flex items-center justify-center overflow-hidden relative">
        <MachineImage src={plan.machineImage} alt={plan.name} />
        <span className="absolute top-3 end-3 text-xs bg-blue-900/90 text-blue-200 px-2 py-1 rounded-full">
          {t("shared")}
        </span>
      </div>
      <div className="p-6 flex flex-col flex-1">
        <h3 className="text-xl font-bold text-yellow-500 mb-1">{plan.name}</h3>
        {plan.description && (
          <p className="text-gray-400 text-sm mb-3 line-clamp-2">{plan.description}</p>
        )}

        <div className="bg-gray-900/60 rounded-lg p-3 mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">{t("poolProgress")}</span>
            <span className="text-blue-400 font-bold">{plan.poolProgress?.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${plan.poolProgress ?? 0}%` }}
            />
          </div>
          <p className="text-xs text-gray-500">
            ${plan.poolFilled?.toLocaleString()} / ${plan.targetPoolAmount?.toLocaleString()}
            {" · "}{plan.poolParticipants} {t("participants")}
          </p>
        </div>

        <div className="space-y-1 text-sm mb-4 flex-1">
          <p className="text-gray-400">
            {t("dailyReturn")}: <span className="text-green-400">{plan.dailyReturnPercent}%</span>
            {plan.poolDailyProfit != null && (
              <span className="text-gray-500"> ({t("onFullPool")}: ${plan.poolDailyProfit.toFixed(2)}/day)</span>
            )}
          </p>
          <p className="text-gray-400">
            {t("duration")}: <span className="text-white">{plan.durationDays} {t("days")}</span>
          </p>
          <p className="text-gray-400">
            {t("minContribution")}: <span className="text-yellow-500">${plan.minContribution}</span>
            {plan.poolRemaining != null && plan.poolRemaining > 0 && (
              <span className="text-gray-500"> · {t("remaining")}: ${plan.poolRemaining.toLocaleString()}</span>
            )}
          </p>
        </div>

        {mode === "buy" && onContributionChange && (
          <>
            <input
              type="number"
              placeholder={`${t("yourContribution")} (min $${plan.minContribution})`}
              value={contribution}
              onChange={(e) => onContributionChange(e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-700/80 border border-gray-600 mb-2 focus:border-blue-500 outline-none"
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
          <Link
            href="/register"
            className="w-full p-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 text-center"
          >
            {t("joinPool")}
          </Link>
        ) : (
          <button
            type="button"
            onClick={onJoin}
            className="w-full p-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500"
          >
            {t("joinPool")}
          </button>
        )}
      </div>
    </div>
  );
}
