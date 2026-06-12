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
import TrustBadges from "@/components/TrustBadges";
import TestimonialsSection from "@/components/TestimonialsSection";
import HeroStatsStrip from "@/components/HeroStatsStrip";
import PlatformStatsShowcase from "@/components/PlatformStatsShowcase";
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
  const featuredSolo = soloPlans.slice(0, 3);

  return (
    <div className="page-shell">
      <AppHeader showNotifications={false} />

      {/* Hero */}
      <section className="hero-section">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 w-full animate-fade-up">
          <div className="max-w-3xl mx-auto text-center lg:mx-0 lg:text-start">
            <div className="hero-badge mx-auto lg:mx-0 w-fit">{t("heroBadge")}</div>
            <h1 className="hero-title text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-6 text-gold-400 glow-gold">
              {t("heroTitle")}
            </h1>
            <p className="text-lg sm:text-xl text-gray-400 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              {t("heroSubtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/register" className="btn-primary px-8 py-3.5 text-base w-full sm:w-auto">
                {t("startMining")}
              </Link>
              <Link href="#plans" className="btn-secondary px-8 py-3.5 text-base w-full sm:w-auto">
                {t("viewPlans")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <HeroStatsStrip
        users={stats.totalUsers}
        liquidation={stats.totalLiquidation}
        activePlans={stats.activePlans}
      />

      <PlatformStatsShowcase
        totalUsers={stats.totalUsers}
        totalLiquidation={stats.totalLiquidation}
        activePlans={stats.activePlans}
      />

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <h2 className="section-title mb-3">{t("howItWorks")}</h2>
        <p className="section-subtitle">{t("howItWorksDesc")}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map(({ Icon, titleKey, descKey }, i) => (
            <div key={titleKey} className="step-card">
              <div className="step-icon-wrap">
                <Icon />
              </div>
              <span className="text-xs font-bold text-gold-500 mb-2 block">0{i + 1}</span>
              <h3 className="text-lg font-bold text-gray-100 mb-2">{t(titleKey)}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{t(descKey)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Referral */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="referral-banner">
          <p className="iconic-badge mb-4 mx-auto w-fit">{t("referralProgramBadge")}</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-gold-400 mb-3">{t("referralHeadline")}</h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-4">{t("referralLandingDesc")}</p>
          <p className="text-gold-400 font-bold text-lg mb-6">{t("referralCommissionRate")}</p>
          <Link href="/register" className="btn-primary px-8 py-3 inline-block">
            {t("startMining")}
          </Link>
        </div>
      </section>

      {/* Plans */}
      <section id="plans" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <h2 className="section-title mb-3">{t("miningPlans")}</h2>
        <p className="section-subtitle">{t("plansIntro")}</p>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <PlanCardSkeleton key={i} />
            ))}
          </div>
        ) : plans.length === 0 ? (
          <EmptyState title={t("noPlansYet")} description={t("noPlansYetDesc")} />
        ) : (
          <>
            {featuredSolo.length > 0 && (
              <div className="mb-12">
                <h3 className="section-heading-accent">{t("soloPlans")}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredSolo.map((plan, index) => (
                    <SoloPlanCard
                      key={plan.id}
                      plan={plan}
                      mode="landing"
                      isPopular={plan.name.toLowerCase().includes("pro") || index === 1}
                    />
                  ))}
                </div>
              </div>
            )}

            {pooledPlans.length > 0 && (
              <div>
                <h3 className="section-heading-accent">{t("sharedPlans")}</h3>
                <p className="text-gray-400 text-sm mb-6">{t("sharedPlansHint")}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pooledPlans.map((plan) => (
                    <PooledPlanCard key={plan.id} plan={plan} mode="landing" />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <TrustBadges />
      <TestimonialsSection />

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <ExternalLinksBar />
      </section>

      <footer className="site-footer">
        <p className="text-sm text-gray-500 mb-4">{t("footer")}</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center">
          <Link href="/about" className="footer-link">{tn("about")}</Link>
          <Link href="/faq" className="footer-link">{tn("faq")}</Link>
          <Link href="/terms" className="footer-link">{tn("terms")}</Link>
          <Link href="/contact" className="footer-link">{tn("contact")}</Link>
          <Link href="/login" className="footer-link">{tc("login")}</Link>
          <Link href="/register" className="footer-link">{tc("register")}</Link>
        </div>
      </footer>
    </div>
  );
}
