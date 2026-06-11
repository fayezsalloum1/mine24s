"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import ExternalLinksBar from "@/components/ExternalLinksBar";
import SoloPlanCard from "@/components/plans/SoloPlanCard";
import PooledPlanCard from "@/components/plans/PooledPlanCard";
import PlanCardSkeleton from "@/components/ui/PlanCardSkeleton";
import EmptyState from "@/components/ui/EmptyState";
import { RegisterIcon, DepositIcon, EarnIcon } from "@/components/StepIcons";
import MiningHeroVideo from "@/components/MiningHeroVideo";
import PlatformStatsShowcase from "@/components/PlatformStatsShowcase";
import type { ClientPlan } from "@/components/plans/PlanTypes";

interface Stats {
  totalUsers: number;
  totalLiquidation: number;
}

const STEPS = [
  { Icon: RegisterIcon, titleKey: "step1Title" as const, descKey: "step1Desc" as const },
  { Icon: DepositIcon, titleKey: "step2Title" as const, descKey: "step2Desc" as const },
  { Icon: EarnIcon, titleKey: "step3Title" as const, descKey: "step3Desc" as const },
];

export default function LandingPage() {
  const t = useTranslations("landing");
  const tc = useTranslations("common");
  const tn = useTranslations("nav");
  const [plans, setPlans] = useState<ClientPlan[]>([]);
  const [stats, setStats] = useState<Stats>({ totalUsers: 10299, totalLiquidation: 5_498_900 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/plans").then((r) => r.json()),
      fetch("/api/stats").then((r) => r.json()),
    ])
      .then(([plansData, statsData]) => {
        setPlans(Array.isArray(plansData) ? plansData : []);
        setStats({
          totalUsers: statsData?.totalUsers ?? 10299,
          totalLiquidation: statsData?.totalLiquidation ?? statsData?.totalPaid ?? 5_498_900,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const soloPlans = plans.filter((p) => !p.isPooled);
  const pooledPlans = plans.filter((p) => p.isPooled);

  return (
    <div className="page-shell text-white">
      <AppHeader showNotifications={false} />

      <section className="hero-glow relative max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="relative grid lg:grid-cols-2 gap-8 items-center">
          <div className="relative z-10 text-center lg:text-start">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs sm:text-sm font-semibold mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Cloud Mining Platform
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6 text-balance text-gradient-gold leading-tight">
              {t("heroTitle")}
            </h1>
            <p className="text-base sm:text-xl text-slate-400 mb-8 max-w-2xl mx-auto lg:mx-0 text-balance leading-relaxed">
              {t("heroSubtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start max-w-sm sm:max-w-none mx-auto lg:mx-0">
              <Link href="/register" className="btn-primary px-8 py-3.5 rounded-xl text-base">
                {t("getStarted")}
              </Link>
              <Link href="/login" className="btn-secondary px-8 py-3.5 rounded-xl text-base">
                {tc("login")}
              </Link>
            </div>
          </div>
          <div className="relative z-10 h-48 sm:h-64 lg:h-72 rounded-2xl overflow-hidden border border-slate-700/50 shadow-panel hidden sm:block">
            <MiningHeroVideo />
            <div className="absolute bottom-4 left-4 right-4 z-10 flex justify-between text-xs font-mono">
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 mining-status-pulse" /> LIVE
              </span>
              <span className="text-amber-400">24/7 MINING</span>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <h2 className="section-title">{t("howItWorks")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8">
          {STEPS.map(({ Icon, titleKey, descKey }) => (
            <div key={titleKey} className="step-card">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 border border-amber-500/20 flex items-center justify-center">
                  <Icon />
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-amber-400 mb-2">{t(titleKey)}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{t(descKey)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <h2 className="section-title">{t("miningPlans")}</h2>
        <p className="text-slate-400 text-center mb-8 sm:mb-12 max-w-2xl mx-auto text-sm sm:text-base">{t("plansIntro")}</p>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {[1, 2, 3].map((i) => (
              <PlanCardSkeleton key={i} />
            ))}
          </div>
        ) : plans.length === 0 ? (
          <EmptyState title={t("noPlansYet")} description={t("noPlansYetDesc")} />
        ) : (
          <>
            {soloPlans.length > 0 && (
              <div className="mb-10 sm:mb-12">
                <h3 className="text-lg sm:text-xl font-bold text-emerald-400 mb-5 sm:mb-6 flex items-center gap-2">
                  <span className="w-1 h-6 bg-emerald-400 rounded-full" />
                  {t("soloPlans")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                  {soloPlans.map((plan) => (
                    <SoloPlanCard key={plan.id} plan={plan} mode="landing" />
                  ))}
                </div>
              </div>
            )}

            {pooledPlans.length > 0 && (
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-blue-400 mb-2 flex items-center gap-2">
                  <span className="w-1 h-6 bg-blue-400 rounded-full" />
                  {t("sharedPlans")}
                </h3>
                <p className="text-slate-400 text-sm mb-5 sm:mb-6 ps-3">{t("sharedPlansHint")}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                  {pooledPlans.map((plan) => (
                    <PooledPlanCard key={plan.id} plan={plan} mode="landing" />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <PlatformStatsShowcase
        totalUsers={stats.totalUsers}
        totalLiquidation={stats.totalLiquidation}
      />

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <ExternalLinksBar />
      </section>

      <footer className="border-t border-slate-800/80 py-8 sm:py-10 text-center text-slate-500 bg-slate-950/30">
        <p className="text-sm">{t("footer")}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center mt-4 text-sm">
          <Link href="/about" className="hover:text-amber-400 transition-colors">{tn("about")}</Link>
          <Link href="/faq" className="hover:text-amber-400 transition-colors">{tn("faq")}</Link>
          <Link href="/terms" className="hover:text-amber-400 transition-colors">{tn("terms")}</Link>
          <Link href="/contact" className="hover:text-amber-400 transition-colors">{tn("contact")}</Link>
          <Link href="/login" className="hover:text-amber-400 transition-colors">{tc("login")}</Link>
          <Link href="/register" className="hover:text-amber-400 transition-colors">{tc("register")}</Link>
        </div>
      </footer>
    </div>
  );
}
