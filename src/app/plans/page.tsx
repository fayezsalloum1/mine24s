"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import DepositModal from "@/components/DepositModal";
import SoloPlanCard from "@/components/plans/SoloPlanCard";
import PooledPlanCard from "@/components/plans/PooledPlanCard";
import PlanCardSkeleton from "@/components/ui/PlanCardSkeleton";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/Toast";
import type { ClientPlan } from "@/components/plans/PlanTypes";

type PendingAction =
  | { type: "solo"; plan: ClientPlan }
  | { type: "pooled"; plan: ClientPlan; amount: number };

export default function PlansPage() {
  const { status } = useSession();
  const router = useRouter();
  const t = useTranslations("plans");
  const { toast } = useToast();
  const [plans, setPlans] = useState<ClientPlan[]>([]);
  const [contributions, setContributions] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const loadPlans = () => {
    setLoading(true);
    fetch("/api/plans")
      .then((r) => r.json())
      .then((data) => setPlans(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    loadPlans();
  }, []);

  function requestBuy(plan: ClientPlan) {
    setPendingAction({ type: "solo", plan });
  }

  function requestJoin(plan: ClientPlan) {
    const amount = parseFloat(contributions[plan.id] || "0");
    if (!amount || amount < (plan.minContribution ?? 1)) {
      toast(t("minContributionRequired", { min: plan.minContribution ?? 1 }), "error");
      return;
    }
    setPendingAction({ type: "pooled", plan, amount });
  }

  async function executePurchase() {
    if (!pendingAction) return;
    setBuying(true);

    const body: { planId: string; amount?: number } = { planId: pendingAction.plan.id };
    if (pendingAction.type === "pooled") {
      body.amount = pendingAction.amount;
    }

    const res = await fetch("/api/plans/buy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setBuying(false);
    setPendingAction(null);

    if (data.error) {
      if (data.error === "Insufficient balance") setDepositOpen(true);
      toast(data.error, "error");
    } else {
      toast(data.message || t("purchaseSuccess"), "success");
      loadPlans();
    }
  }

  function confirmMessage(): string {
    if (!pendingAction) return "";
    if (pendingAction.type === "solo") {
      return t("confirmSolo", {
        name: pendingAction.plan.name,
        price: pendingAction.plan.price.toLocaleString(),
      });
    }
    return t("confirmPooled", {
      name: pendingAction.plan.name,
      amount: pendingAction.amount.toFixed(2),
    });
  }

  const soloPlans = plans.filter((p) => !p.isPooled);
  const pooledPlans = plans.filter((p) => p.isPooled);

  return (
    <div className="page-shell text-white">
      <AppHeader />
      <div className="page-content">
        <h1 className="page-title">{t("title")}</h1>
        <p className="text-slate-400 mb-6 sm:mb-8 text-sm sm:text-base">{t("subtitle")}</p>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <PlanCardSkeleton key={i} />
            ))}
          </div>
        ) : plans.length === 0 ? (
          <EmptyState
            icon="⛏️"
            title={t("noPlans")}
            description={t("noPlansDesc")}
            action={
              <Link href="/dashboard" className="text-yellow-500 hover:underline">
                ← {t("backToDashboard")}
              </Link>
            }
          />
        ) : (
          <>
            {soloPlans.length > 0 && (
              <section className="mb-10">
                <h2 className="text-lg sm:text-xl font-bold text-emerald-400 mb-4 flex items-center gap-2">
                  <span className="w-1 h-5 bg-emerald-400 rounded-full" />
                  {t("soloPlans")}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {soloPlans.map((plan) => (
                    <SoloPlanCard key={plan.id} plan={plan} onBuy={() => requestBuy(plan)} />
                  ))}
                </div>
              </section>
            )}

            {pooledPlans.length > 0 && (
              <section>
                <h2 className="text-lg sm:text-xl font-bold text-blue-400 mb-2 flex items-center gap-2">
                  <span className="w-1 h-5 bg-blue-400 rounded-full" />
                  {t("sharedPlans")}
                </h2>
                <p className="text-gray-400 text-sm mb-4">{t("sharedPlansHint")}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pooledPlans.map((plan) => (
                    <PooledPlanCard
                      key={plan.id}
                      plan={plan}
                      contribution={contributions[plan.id] ?? ""}
                      onContributionChange={(v) => setContributions({ ...contributions, [plan.id]: v })}
                      onJoin={() => requestJoin(plan)}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        <Link href="/dashboard" className="mt-8 inline-block text-gray-400 hover:text-white">
          ← {t("backToDashboard")}
        </Link>
      </div>

      <ConfirmModal
        open={Boolean(pendingAction)}
        title={t("confirmTitle")}
        message={confirmMessage()}
        confirmLabel={pendingAction?.type === "pooled" ? t("joinPool") : t("buyNow")}
        loading={buying}
        onConfirm={executePurchase}
        onCancel={() => setPendingAction(null)}
      />

      <DepositModal open={depositOpen} onClose={() => setDepositOpen(false)} />
    </div>
  );
}
