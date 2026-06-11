"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import MachineImage from "@/components/MachineImage";
import type { ClientPlan } from "./PlanTypes";

interface SoloPlanCardProps {
  plan: ClientPlan;
  mode?: "landing" | "buy";
  onBuy?: () => void;
}

export default function SoloPlanCard({ plan, mode = "buy", onBuy }: SoloPlanCardProps) {
  const tPlans = useTranslations("plans");
  const tLanding = useTranslations("landing");
  const t = mode === "landing" ? tLanding : tPlans;
  const tc = useTranslations("common");

  return (
    <div className="plan-card flex flex-col h-full">
      <div className="h-48 bg-gray-800/50 flex items-center justify-center overflow-hidden">
        <MachineImage src={plan.machineImage} alt={plan.name} />
      </div>
      <div className="p-6 flex flex-col flex-1">
        <h3 className="text-xl font-bold text-yellow-500 mb-1">{plan.name}</h3>
        {plan.description && (
          <p className="text-gray-400 text-sm mb-3 line-clamp-2">{plan.description}</p>
        )}
        <div className="space-y-1 text-sm mb-4 flex-1">
          <p className="text-gray-400">
            {t("price")}: <span className="text-white font-bold">${plan.price.toLocaleString()}</span>
          </p>
          <p className="text-gray-400">
            {t("dailyReturn")}: <span className="text-green-400 font-bold">{plan.dailyReturnPercent}%</span>
          </p>
          <p className="text-gray-400">
            {t("dailyProfit")}: <span className="text-green-400 font-bold">${plan.soloDailyProfit?.toFixed(2)}</span>
          </p>
          <p className="text-gray-400">
            {t("duration")}: <span className="text-white">{plan.durationDays} {t("days")}</span>
          </p>
        </div>
        {mode === "landing" ? (
          <Link
            href="/register"
            className="w-full p-3 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 text-center"
          >
            {tc("register")}
          </Link>
        ) : (
          <button
            type="button"
            onClick={onBuy}
            className="w-full p-3 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400"
          >
            {t("buyNow")}
          </button>
        )}
      </div>
    </div>
  );
}
