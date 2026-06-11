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
import type { ClientPlan } from "@/components/plans/PlanTypes";

interface Stats {
  totalUsers: number;
  totalPaid: number;
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
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalPaid: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/plans").then((r) => r.json()),
      fetch("/api/stats").then((r) => r.json()),
    ])
      .then(([plansData, statsData]) => {
        setPlans(Array.isArray(plansData) ? plansData : []);
        setStats(statsData ?? { totalUsers: 0, totalPaid: 0 });
      })
      .finally(() => setLoading(false));
  }, []);

  const soloPlans = plans.filter((p) => !p.isPooled);
  const pooledPlans = plans.filter((p) => p.isPooled);

  return (
    <div className="page-shell text-white">
      <AppHeader showNotifications={false} />

      <section className="hero-glow max-w-6xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-yellow-500 mb-6 text-balance">
          {t("heroTitle")}
        </h1>
        <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto text-balance">
          {t("heroSubtitle")}
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/register"
            className="px-8 py-3 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors"
          >
            {t("getStarted")}
          </Link>
          <Link
            href="/login"
            className="px-8 py-3 glass-panel font-bold rounded-lg hover:border-yellow-500/40 transition-colors"
          >
            {tc("login")}
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-yellow-500 text-center mb-12">{t("howItWorks")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map(({ Icon, titleKey, descKey }) => (
            <div key={titleKey} className="glass-panel p-8 rounded-xl text-center border border-gray-700/50">
              <div className="flex justify-center mb-4">
                <Icon />
              </div>
              <h3 className="text-xl font-bold text-yellow-500 mb-2">{t(titleKey)}</h3>
              <p className="text-gray-400">{t(descKey)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-yellow-500 text-center mb-4">{t("miningPlans")}</h2>
        <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">{t("plansIntro")}</p>

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
            {soloPlans.length > 0 && (
              <div className="mb-12">
                <h3 className="text-xl font-bold text-green-400 mb-6">{t("soloPlans")}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {soloPlans.map((plan) => (
                    <SoloPlanCard key={plan.id} plan={plan} mode="landing" />
                  ))}
                </div>
              </div>
            )}

            {pooledPlans.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-blue-400 mb-2">{t("sharedPlans")}</h3>
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

      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-yellow-500 text-center mb-12">{t("platformStats")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <div className="stat-card text-center">
            <p className="text-4xl font-bold text-yellow-500">{stats.totalUsers.toLocaleString()}</p>
            <p className="text-gray-400 mt-2">{t("totalUsers")}</p>
          </div>
          <div className="stat-card text-center">
            <p className="text-4xl font-bold text-green-400">
              ${stats.totalPaid?.toLocaleString() ?? "0"}
            </p>
            <p className="text-gray-400 mt-2">{t("totalPaid")}</p>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-8">
        <ExternalLinksBar />
      </section>

      <footer className="border-t border-gray-800 py-8 text-center text-gray-500">
        <p>{t("footer")}</p>
        <div className="flex flex-wrap gap-4 justify-center mt-4 text-sm">
          <Link href="/about" className="hover:text-yellow-500">{tn("about")}</Link>
          <Link href="/faq" className="hover:text-yellow-500">{tn("faq")}</Link>
          <Link href="/terms" className="hover:text-yellow-500">{tn("terms")}</Link>
          <Link href="/contact" className="hover:text-yellow-500">{tn("contact")}</Link>
          <Link href="/login" className="hover:text-yellow-500">{tc("login")}</Link>
          <Link href="/register" className="hover:text-yellow-500">{tc("register")}</Link>
        </div>
      </footer>
    </div>
  );
}
