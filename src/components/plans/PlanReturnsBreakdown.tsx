"use client";

import { useTranslations } from "next-intl";
import type { PlanReturnProjection } from "@/lib/plan-returns";
import { PAYOUT_INTERVAL_DAYS } from "@/lib/mining-math";

type Props = {
  projection: PlanReturnProjection;
  isPooled?: boolean;
  poolProgress?: number;
  poolActive?: boolean;
};

export default function PlanReturnsBreakdown({
  projection,
  isPooled = false,
  poolProgress,
  poolActive = true,
}: Props) {
  const t = useTranslations("returns");

  return (
    <div className="plan-returns-box">
      <p className="plan-returns-title">{t("transparentModel")}</p>

      {isPooled && !poolActive && poolProgress != null && (
        <p className="plan-returns-pool-note">
          {t("poolStopNote", { progress: poolProgress.toFixed(0) })}
        </p>
      )}

      <div className="plan-returns-rows">
        <div className="plan-returns-row">
          <span className="text-gray-500">{t("yourInvestment")}</span>
          <span className="text-gray-100 font-semibold">
            ${projection.principal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="plan-returns-row">
          <span className="text-gray-500">{t("dailyProfitRate", { rate: projection.dailyReturnPercent })}</span>
          <span className="text-profit font-semibold">${projection.dailyProfit.toFixed(2)}</span>
        </div>
        <div className="plan-returns-row">
          <span className="text-gray-500">{t("overDays", { days: projection.durationDays })}</span>
          <span className="text-profit font-bold">
            +${projection.totalMiningProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="plan-returns-row text-xs">
          <span className="text-gray-600">
            {t("payoutSchedule", {
              count: projection.periodPayoutCount,
              amount: projection.periodPayoutAmount.toFixed(2),
              days: PAYOUT_INTERVAL_DAYS,
            })}
          </span>
        </div>
      </div>

      <div className="plan-returns-principal">
        <div className="flex items-start gap-2">
          <span className="text-gold-400 shrink-0">✓</span>
          <div>
            <p className="text-gold-400 font-bold text-sm">{t("principalGuaranteeTitle")}</p>
            <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">
              {t("principalGuaranteeDesc", {
                amount: projection.principal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                days: projection.durationDays,
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="plan-returns-total">
        <div className="plan-returns-row">
          <span className="text-gray-300 font-medium">{t("totalYouReceive")}</span>
          <span className="text-xl font-bold text-gold-400 glow-gold">
            ${projection.totalReturn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <p className="text-xs text-emerald-400/90 mt-1 text-end font-semibold">
          {t("miningRoi", { roi: projection.roiPercent.toFixed(0) })}
        </p>
      </div>
    </div>
  );
}
