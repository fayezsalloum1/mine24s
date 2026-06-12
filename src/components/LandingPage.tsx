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
import HeroStatsStrip from "@/components/HeroStatsStrip";
import { PLATFORM_DISPLAY_DEFAULTS } from "@/lib/platform-display-stats";
import type { ClientPlan } from "@/components/plans/PlanTypes";

interface Stats {
  totalUsers: number;
  totalLiquidation: number;
  activePlans: number;
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
  const [stats, setStats] = useState<Stats>({
    totalUsers: PLATFORM_DISPLAY_DEFAULTS.totalUsers,
    totalLiquidation: PLATFORM_DISPLAY_DEFAULTS.totalLiquidation,
    activePlans: PLATFORM_DISPLAY_DEFAULTS.activePlans,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/plans").then((r) => r.json()),
      fetch("/api/stats").then((r) => r.json()),
    ])
      .then(([plansData, statsData]) => {
        setPlans(Array.isArray(plansData) ? plansData : []);
        setStats({
          totalUsers: statsData?.totalUsers ?? PLATFORM_DISPLAY_DEFAULTS.totalUsers,
          totalLiquidation:
            statsData?.totalLiquidation ?? statsData?.totalPaid ?? PLATFORM_DISPLAY_DEFAULTS.totalLiquidation,
          activePlans: statsData?.activePlans ?? PLATFORM_DISPLAY_DEFAULTS.activePlans,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const soloPlans = plans.filter((p) => !p.isPooled);
  const pooledPlans = plans.filter((p) => p.isPooled);

  return (
    <div className="page-shell text-white">
      <AppHeader showNotifications={false} />

      <section className="hero-glow relative max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-stretch">
          <div className="text-center lg:text-start order-2 lg:order-1 hero-text-block">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs sm:text-sm font-semibold mb-5 sm:mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              Live Cloud Mining Platform
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6 text-balance text-gradient-gold leading-tight">
              {t("heroTitle")}
            </h1>
            <p className="text-sm sm:text-lg text-slate-300 mb-6 sm:mb-8 max-w-2xl mx-auto lg:mx-0 text-balance leading-relaxed">
              {t("heroSubtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
              <Link href="/register" className="btn-primary px-8 py-3.5 rounded-xl text-base w-full sm:w-auto text-center">
                {t("getStarted")}
              </Link>
              <Link href="/login" className="btn-secondary px-8 py-3.5 rounded-xl text-base w-full sm:w-auto text-center">
                {tc("login")}
              </Link>
            </div>
          </div>
          <div className="relative h-52 sm:h-64 lg:h-72 rounded-2xl overflow-hidden border border-slate-600/50 shadow-panel order-1 lg:order-2">
            <MiningHeroVideo />
            <div className="absolute bottom-0 inset-x-0 z-10 flex justify-between px-4 py-3 bg-gradient-to-t from-black/80 to-transparent text-xs font-mono">
              <span className="text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 mining-status-pulse" /> LIVE
              </span>
              <span className="text-amber-400">☁️ BTC · 24/7 MINING</span>
            </div>
          </div>
        </div>
      </section>

      <HeroStatsStrip
        users={stats.totalUsers}
        activePlans={stats.activePlans}
        liquidation={stats.totalLiquidation}
      />

      <PlatformStatsShowcase
        totalUsers={stats.totalUsers}
        totalLiquidation={stats.totalLiquidation}
        activePlans={stats.activePlans}
      />

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="rounded-2xl border border-amber-500/35 bg-gradient-to-r from-amber-950/50 via-slate-900/80 to-emerald-950/40 p-6 sm:p-8 text-center">
          <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-semibold mb-4">
            {t("referralProgramBadge")}
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-gradient-gold mb-3">{t("referralHeadline")}</h2>
          <p className="text-slate-300 max-w-2xl mx-auto mb-4">{t("referralLandingDesc")}</p>
          <p className="text-amber-400 font-bold text-lg mb-6">{t("referralCommissionRate")}</p>
          <Link href="/register" className="btn-primary px-8 py-3.5 rounded-xl inline-block">
            {t("getStarted")}
          </Link>
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
