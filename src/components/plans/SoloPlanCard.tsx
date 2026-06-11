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
    <div className="plan-card flex flex-col h-full group">
      <div className="h-40 sm:h-48 bg-gradient-to-b from-slate-800/80 to-slate-900/90 flex items-center justify-center overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgb(245_158_11/0.08),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <MachineImage src={plan.machineImage} alt={plan.name} />
      </div>
      <div className="p-5 sm:p-6 flex flex-col flex-1">
        <h3 className="text-lg sm:text-xl font-bold text-gradient-gold mb-1">{plan.name}</h3>
        {plan.description && (
          <p className="text-slate-400 text-sm mb-3 line-clamp-2">{plan.description}</p>
        )}
        <div className="space-y-2 text-sm mb-5 flex-1">
          <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
            <span className="text-slate-400">{t("price")}</span>
            <span className="text-white font-bold">${plan.price.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
            <span className="text-slate-400">{t("dailyReturn")}</span>
            <span className="text-emerald-400 font-bold">{plan.dailyReturnPercent}%</span>
          </div>
          <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
            <span className="text-slate-400">{t("dailyProfit")}</span>
            <span className="text-emerald-400 font-bold">${plan.soloDailyProfit?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center py-1.5">
            <span className="text-slate-400">{t("duration")}</span>
            <span className="text-slate-200">{plan.durationDays} {t("days")}</span>
          </div>
        </div>
        {mode === "landing" ? (
          <Link href="/register" className="w-full btn-primary py-3 rounded-xl text-center">
            {tc("register")}
          </Link>
        ) : (
          <button type="button" onClick={onBuy} className="w-full btn-primary py-3 rounded-xl">
            {t("buyNow")}
          </button>
        )}
      </div>
    </div>
  );
}
