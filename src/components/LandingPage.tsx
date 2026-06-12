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

      <section className="hero-glow relative max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-20">
        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 items-stretch">
          <div className="text-center lg:text-start order-2 lg:order-1 hero-text-block">
            <div className="iconic-badge iconic-badge-live mb-6 sm:mb-7">
              Live Cloud Mining Platform
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[3.5rem] font-black mb-5 sm:mb-6 text-balance text-gradient-gold leading-[1.08] tracking-tight">
              {t("heroTitle")}
            </h1>
            <p className="text-sm sm:text-lg text-slate-300/90 mb-8 sm:mb-10 max-w-2xl mx-auto lg:mx-0 text-balance leading-relaxed">
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
          <div className="relative h-56 sm:h-72 lg:h-80 rounded-2xl overflow-hidden border border-white/10 shadow-iconic order-1 lg:order-2 iconic-panel">
            <MiningHeroVideo />
            <div className="absolute bottom-0 inset-x-0 z-10 flex justify-between px-4 py-3.5 bg-gradient-to-t from-black/90 via-black/50 to-transparent text-xs font-mono">
              <span className="text-emerald-400 flex items-center gap-1.5 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 mining-status-pulse" /> LIVE
              </span>
              <span className="text-amber-400 font-semibold tracking-wide">BTC · 24/7 MINING</span>
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
        <div className="iconic-banner p-7 sm:p-10 relative">
          <div className="iconic-banner-glow -top-20 -right-20 w-48 h-48 bg-amber-500/15" />
          <div className="iconic-banner-glow -bottom-16 -left-16 w-40 h-40 bg-emerald-500/10" />
          <div className="relative z-10">
            <p className="iconic-badge mb-5 mx-auto w-fit">{t("referralProgramBadge")}</p>
            <h2 className="text-2xl sm:text-4xl font-black text-gradient-gold mb-4 tracking-tight">{t("referralHeadline")}</h2>
            <p className="text-slate-300/90 max-w-2xl mx-auto mb-4 leading-relaxed">{t("referralLandingDesc")}</p>
            <p className="text-amber-300 font-black text-xl sm:text-2xl mb-8 tracking-tight">{t("referralCommissionRate")}</p>
            <Link href="/register" className="btn-primary px-10 py-3.5 rounded-xl inline-block">
              {t("getStarted")}
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="section-eyebrow">
          <span className="text-xs font-bold uppercase tracking-widest2 text-amber-400/80">{t("howItWorks")}</span>
        </div>
        <h2 className="section-title mb-8 sm:mb-12">{t("howItWorks")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8">
          {STEPS.map(({ Icon, titleKey, descKey }) => (
            <div key={titleKey} className="step-card">
              <div className="step-icon-wrap">
                <Icon />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-amber-300 mb-2">{t(titleKey)}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{t(descKey)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="section-eyebrow">
          <span className="text-xs font-bold uppercase tracking-widest2 text-amber-400/80">{t("miningPlans")}</span>
        </div>
        <h2 className="section-title mb-3">{t("miningPlans")}</h2>
        <p className="section-subtitle">{t("plansIntro")}</p>

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
                <h3 className="section-heading-accent text-emerald-400 before:bg-emerald-400">
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
                <h3 className="section-heading-accent text-cyan-400 before:bg-cyan-400">
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

      <footer className="iconic-footer">
        <p className="text-sm text-slate-500">{t("footer")}</p>
        <div className="flex flex-wrap gap-x-5 gap-y-2 justify-center mt-5">
          <Link href="/about" className="iconic-footer-link">{tn("about")}</Link>
          <Link href="/faq" className="iconic-footer-link">{tn("faq")}</Link>
          <Link href="/terms" className="iconic-footer-link">{tn("terms")}</Link>
          <Link href="/contact" className="iconic-footer-link">{tn("contact")}</Link>
          <Link href="/login" className="iconic-footer-link">{tc("login")}</Link>
          <Link href="/register" className="iconic-footer-link">{tc("register")}</Link>
        </div>
      </footer>
    </div>
  );
}
