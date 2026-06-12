"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import MiningMachineVisual from "@/components/MiningMachineVisual";
import PlanReturnsBreakdown from "@/components/plans/PlanReturnsBreakdown";
import { getPlanReturnProjection } from "@/lib/plan-returns";
import type { ClientPlan } from "./PlanTypes";
import { PAYOUT_INTERVAL_DAYS } from "@/lib/mining-math";

interface SoloPlanCardProps {
  plan: ClientPlan;
  mode?: "landing" | "buy";
  onBuy?: () => void;
  isPopular?: boolean;
  loading?: boolean;
}

export default function SoloPlanCard({
  plan,
  mode = "buy",
  onBuy,
  isPopular = false,
  loading = false,
}: SoloPlanCardProps) {
  const tPlans = useTranslations("plans");
  const tLanding = useTranslations("landing");
  const t = mode === "landing" ? tLanding : tPlans;
  const tc = useTranslations("common");

  const dailyProfit = plan.soloDailyProfit ?? 0;
  const projection = getPlanReturnProjection(
    plan.price,
    plan.dailyReturnPercent,
    plan.durationDays,
    dailyProfit
  );

  return (
    <div className={`plan-card flex flex-col h-full group ${isPopular ? "plan-card-popular" : ""}`}>
      {isPopular && <span className="badge-popular">{tPlans("mostPopular")}</span>}
      <div className="h-44 sm:h-52 relative">
        <MiningMachineVisual
          name={plan.name}
          imageSrc={plan.machineImage}
          videoSrc={plan.machineVideo}
          online={plan.machineOnline ?? true}
          uptimeHours={plan.machineUptimeHours ?? 0}
          onlineSince={plan.machineOnlineSince}
        />
      </div>
      <div className="p-5 sm:p-6 flex flex-col flex-1">
        <h3 className="text-lg font-bold text-gray-100 mb-1">{plan.name}</h3>
        {plan.description && (
          <p className="text-gray-400 text-sm mb-4 line-clamp-2">{plan.description}</p>
        )}

        <div className="mb-4 p-3 rounded-lg bg-profit/5 border border-profit/20">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">{t("dailyProfit")}</p>
          <p className="text-2xl sm:text-3xl font-bold text-profit glow-profit">${dailyProfit.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">
            {t("payoutEvery")}: ${(dailyProfit * PAYOUT_INTERVAL_DAYS).toFixed(2)}
          </p>
        </div>

        <PlanReturnsBreakdown projection={projection} />

        <div className="space-y-2 text-sm mb-5 flex-1 mt-4">
          <div className="flex justify-between py-1.5 border-b border-gray-800">
            <span className="text-gray-400">{t("price")}</span>
            <span className="text-gray-100 font-semibold">${plan.price.toLocaleString()}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-800">
            <span className="text-gray-400">{t("dailyReturn")}</span>
            <span className="text-profit font-semibold">{plan.dailyReturnPercent}%</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-gray-400">{t("duration")}</span>
            <span className="text-gray-300">{plan.durationDays} {t("days")}</span>
          </div>
        </div>

        {mode === "landing" ? (
          <Link href="/register" className="w-full btn-primary py-3 rounded-lg text-center">
            {tc("register")}
          </Link>
        ) : (
          <button
            type="button"
            onClick={onBuy}
            disabled={loading}
            className="w-full btn-primary py-3 rounded-lg disabled:opacity-60"
          >
            {loading && (
              <span className="inline-block w-4 h-4 border-2 border-navy-900/30 border-t-navy-900 rounded-full animate-spin" />
            )}
            {t("buyNow")}
          </button>
        )}
      </div>
    </div>
  );
}
