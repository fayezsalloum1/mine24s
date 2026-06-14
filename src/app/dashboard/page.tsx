"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { fetchJsonWithRetry } from "@/lib/fetch-json";
import { useTranslations } from "next-intl";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import DashboardShell from "@/components/DashboardShell";
import ExternalLinksBar from "@/components/ExternalLinksBar";
import DepositModal from "@/components/DepositModal";
import ActivePlansSection from "@/components/ActivePlansSection";
import LiveProfitCard from "@/components/LiveProfitCard";
import ReferralShowcase from "@/components/ReferralShowcase";
import { useAuth } from "@/components/AuthProvider";

interface UserData {
  balance: number;
  creditedProfit?: number;
  accruingProfit?: number;
  availableProfitBalance?: number;
  referralLink: string;
  totalReferrals: number;
  totalReferralEarned: number;
  userPlans: Array<{
    id: string;
    purchasedAt: string;
    isActive: boolean;
    purchasePrice?: number;
    dailyReturnPercentSnapshot?: number;
    daysCredited?: number;
    principalReturned?: boolean;
    completedAt?: string | null;
    plan: {
      name: string;
      price: number;
      dailyReturnPercent: number;
      machineImage?: string;
    };
  }>;
  pendingPoolJoins?: Array<{
    id: string;
    amount: number;
    planName: string;
    targetAmount: number;
    filledAmount: number;
    progress: number;
  }>;
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    status: string;
    createdAt: string;
  }>;
}

export default function DashboardPage() {
  const { user, loading, requires2FA, signOut } = useAuth();
  const router = useRouter();
  const t = useTranslations("dashboard");
  const tt = useTranslations("transactionTypes");
  const tc = useTranslations("common");
  const [userData, setUserData] = useState<UserData | null>(null);
  const [depositOpen, setDepositOpen] = useState(false);
  const [loadError, setLoadError] = useState("");

  const loadUser = useCallback(async () => {
    const { data, ok, status } = await fetchJsonWithRetry<UserData & { error?: string; staleSession?: boolean }>("/api/user/me");

    if (!data) {
      setLoadError(status === 404 ? "API not found. Restart the dev server on port 3000." : "Failed to load account data.");
      return;
    }

    if (!ok) {
      if (data.staleSession) {
        await signOut();
        return;
      }
      setLoadError(
        data.error === "Failed to load user data"
          ? "Could not load account. Refresh the page or try again in a moment."
          : (data.error ?? "Failed to load account data.")
      );
      return;
    }

    setLoadError("");
    setUserData(data);
  }, [signOut]);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (requires2FA) router.push("/verify-2fa");
  }, [requires2FA, router]);

  useEffect(() => {
    if (user && !requires2FA) loadUser();
  }, [user, requires2FA, loadUser]);

  useEffect(() => {
    if (!user || requires2FA) return;
    const interval = setInterval(loadUser, 60000);
    return () => clearInterval(interval);
  }, [user, requires2FA, loadUser]);

  if (loading) {
    return (
      <div className="page-shell flex items-center justify-center text-white">
        {tc("loading")}
      </div>
    );
  }

  return (
    <div className="page-shell">
      <AppHeader />
      <DashboardShell>
        <div className="page-content">
          <h1 className="page-title">{t("title")}</h1>

        {loadError && (
          <div className="bg-red-900/40 border border-red-500 text-red-300 p-4 rounded-lg mb-6">
            {loadError}
          </div>
        )}

        <div className="mb-4">
          <LiveProfitCard
            creditedProfit={userData?.creditedProfit ?? 0}
            balance={userData?.balance ?? 0}
            userPlans={userData?.userPlans ?? []}
          />
        </div>

        {userData?.referralLink && (
          <ReferralShowcase
            referralLink={userData.referralLink}
            totalReferrals={userData.totalReferrals ?? 0}
            totalReferralEarned={userData.totalReferralEarned ?? 0}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="stat-card">
            <p className="iconic-stat-label">{t("availableBalance")}</p>
            <p className="text-2xl sm:text-3xl font-bold text-gold-400 glow-gold tabular-nums">
              ${userData?.balance?.toFixed(2) ?? "0.00"}
            </p>
          </div>
          <div className="stat-card">
            <p className="iconic-stat-label">{t("withdrawableProfit")}</p>
            <p className="text-2xl sm:text-3xl font-bold text-profit glow-profit tabular-nums">
              ${userData?.availableProfitBalance?.toFixed(2) ?? "0.00"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
          <button type="button" onClick={() => setDepositOpen(true)} className="action-tile-deposit">
            <span className="text-2xl">💰</span>
            {t("deposit")}
          </button>
          <Link href="/plans" className="action-tile-plans">
            <span className="text-2xl">⛏️</span>
            {t("buyPlan")}
          </Link>
          <Link href="/withdraw" className="action-tile-withdraw">
            <span className="text-2xl">↗</span>
            {t("requestWithdrawal")}
          </Link>
        </div>

        {(userData?.pendingPoolJoins?.length ?? 0) > 0 && (
          <div className="mb-8 plan-card plan-card-pooled p-5">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-bold text-blue-400">{t("pendingPools")}</h2>
              <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full">
                {t("pendingPoolBadge")}
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-4">{t("poolActivatesWhenFull")}</p>
            <ul className="space-y-4">
              {userData!.pendingPoolJoins!.map((pool) => (
                <li key={pool.id} className="bg-gray-900/50 rounded-lg p-4">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className="text-white font-medium">{pool.planName}</span>
                    <span className="text-sm text-blue-300">${pool.amount.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mb-1">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${pool.progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{pool.progress.toFixed(0)}% {t("poolFilled")}</span>
                    <span>${pool.filledAmount.toLocaleString()} / ${pool.targetAmount.toLocaleString()}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mb-8">
          <h2 className="section-heading-accent text-amber-300 before:bg-amber-400 mb-4">
            {t("activePlans")}
          </h2>
          <ActivePlansSection userPlans={userData?.userPlans ?? []} />
        </div>

        <div className="mb-8">
          <h2 className="section-heading-accent mb-4">{t("transactionHistory")}</h2>
          <div className="glass-card overflow-x-auto">
            {userData?.transactions?.length ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t("type")}</th>
                    <th>{tc("amount")}</th>
                    <th>{tc("status")}</th>
                    <th>{tc("date")}</th>
                  </tr>
                </thead>
                <tbody>
                  {userData.transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td>{tt(tx.type as "DEPOSIT")}</td>
                      <td className={tx.amount >= 0 ? "text-profit font-medium" : "text-red-400 font-medium"}>
                        ${Math.abs(tx.amount).toFixed(2)}
                      </td>
                      <td>
                        <span
                          className={
                            tx.status === "CONFIRMED"
                              ? "status-confirmed"
                              : tx.status === "REJECTED"
                                ? "status-rejected"
                                : "status-pending"
                          }
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="text-gray-400 text-sm">{new Date(tx.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="p-4 text-gray-400">{t("noTransactions")}</p>
            )}
          </div>
        </div>

        <ExternalLinksBar />

        {user?.role === "ADMIN" && (
          <Link href="/admin" className="mt-6 block text-center btn-secondary py-3.5">
            {tc("admin")}
          </Link>
        )}
        </div>
      </DashboardShell>

      <DepositModal
        open={depositOpen}
        onClose={() => setDepositOpen(false)}
        onDepositDetected={() => {
          loadUser();
          setDepositOpen(false);
        }}
      />
    </div>
  );
}
