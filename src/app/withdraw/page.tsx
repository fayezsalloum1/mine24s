"use client";

import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import ReferralLinkActions from "@/components/ReferralLinkActions";
import { formatCountdown, getSoonestPlanPayoutMs } from "@/lib/mining-math";
import { useNow } from "@/hooks/useNow";
import { fetchJson } from "@/lib/fetch-json";

interface WithdrawData {
  withdrawAllowed: boolean;
  referralLink: string;
  balance: number;
  availableBalance?: number;
  availableProfitBalance?: number;
  accruingProfit?: number;
  creditedProfit?: number;
  pendingWithdrawalAmount?: number;
  totalDailyProfit?: number;
  userPlans?: Array<{
    purchasedAt: string;
    isActive: boolean;
    purchasePrice?: number;
    dailyReturnPercentSnapshot?: number;
    durationDaysSnapshot?: number;
    daysCredited?: number;
    principalReturned?: boolean;
    plan: { price: number; dailyReturnPercent: number; durationDays?: number };
  }>;
}

export default function WithdrawPage() {
  const { status } = useSession();
  const router = useRouter();
  const t = useTranslations("withdraw");
  const tc = useTranslations("common");
  const td = useTranslations("dashboard");
  const now = useNow();
  const [amount, setAmount] = useState("");
  const [network, setNetwork] = useState("ERC20");
  const [withdrawalAddress, setWithdrawalAddress] = useState("");
  const [data, setData] = useState<WithdrawData | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = useCallback(async () => {
    const { data, ok } = await fetchJson<WithdrawData & { error?: string }>("/api/withdraw");
    if (ok && data) setData(data);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [loadData]);

  const availableProfit = useMemo(() => {
    if (!data) return 0;
    const pending = data.pendingWithdrawalAmount ?? 0;
    const credited = data.creditedProfit ?? 0;
    const liveAccruing = data.accruingProfit ?? 0;
    const totalProfit = credited + liveAccruing;
    return Math.max(0, Math.min(data.balance - pending, totalProfit - pending));
  }, [data]);

  const nextPayoutMs = useMemo(() => {
    if (!data?.userPlans?.length) return 0;
    return getSoonestPlanPayoutMs(data.userPlans, now);
  }, [data, now]);

  const parsedAmount = parseFloat(amount);
  const isOverLimit = Number.isFinite(parsedAmount) && parsedAmount > availableProfit;
  const isSubmitDisabled =
    !amount ||
    !withdrawalAddress.trim() ||
    isOverLimit ||
    parsedAmount <= 0;

  const handleAmountChange = (value: string) => {
    if (value === "") {
      setAmount("");
      return;
    }
    const num = parseFloat(value);
    if (!Number.isFinite(num)) return;
    if (num > availableProfit) {
      setAmount(availableProfit.toFixed(2));
      return;
    }
    setAmount(value);
  };

  const handleMaxClick = () => {
    setAmount(availableProfit.toFixed(2));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (isSubmitDisabled) {
      setError(t("exceedsProfit"));
      return;
    }

    const res = await fetch("/api/withdraw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: parsedAmount,
        network,
        withdrawalAddress,
      }),
    });
    const result = await res.json();
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(t("success"));
      setAmount("");
      loadData();
    }
  };

  if (status === "loading") {
    return <div className="page-shell flex items-center justify-center">{tc("loading")}</div>;
  }

  if (data && !data.withdrawAllowed) {
    return (
      <div className="page-shell text-white">
        <AppHeader />
        <div className="page-content max-w-md">
          <div className="glass-panel p-6 sm:p-8 rounded-2xl">
            <h1 className="text-xl sm:text-2xl font-bold text-red-400 mb-4 text-center">{t("lockedTitle")}</h1>
            <p className="text-slate-400 mb-6 text-center text-sm">{t("lockedMessage")}</p>
            <p className="text-sm text-slate-400 mb-2">{t("shareReferral")}</p>
            <ReferralLinkActions link={data.referralLink} />
            <Link href="/dashboard" className="mt-6 inline-block text-amber-400 hover:underline">
              {tc("back")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell text-white">
      <AppHeader />
      <div className="page-content max-w-md">
        <h1 className="page-title">{t("title")}</h1>

        <div className="stat-card-featured mb-6">
          <p className="text-slate-400 text-sm">{t("availableProfit")}</p>
          <p className="text-2xl sm:text-3xl font-bold text-emerald-400 tabular-nums">${availableProfit.toFixed(4)}</p>
          <div className="flex justify-between text-xs sm:text-sm text-slate-500 mt-2">
            <span>{td("accruingNow")}: ${(data?.accruingProfit ?? 0).toFixed(4)}</span>
            <span className="font-mono text-amber-400">{formatCountdown(nextPayoutMs)}</span>
          </div>
        </div>

        {(data?.pendingWithdrawalAmount ?? 0) > 0 && (
          <p className="text-slate-500 text-sm mb-4">
            {t("pendingWithdrawals")}: ${data?.pendingWithdrawalAmount?.toFixed(2)}
          </p>
        )}
        {error && <p className="text-red-400 mb-4 text-sm">{error}</p>}
        {success && <p className="text-emerald-400 mb-4 text-sm">{success}</p>}
        <form onSubmit={handleSubmit} className="space-y-4 glass-panel p-5 sm:p-6 rounded-2xl">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm text-slate-400">{t("amount")}</label>
              <button type="button" onClick={handleMaxClick} className="text-xs text-amber-400 hover:text-amber-300">
                {t("useMax")}
              </button>
            </div>
            <input
              type="number"
              placeholder={t("amount")}
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-900/70 border border-slate-700/80 focus:border-amber-500/50 outline-none"
              step="0.01"
              min="0"
              max={availableProfit}
            />
            {isOverLimit && <p className="text-red-400 text-sm mt-1">{t("exceedsProfit")}</p>}
          </div>
          <select
            value={network}
            onChange={(e) => setNetwork(e.target.value)}
            className="w-full p-3 rounded-xl bg-slate-900/70 border border-slate-700/80 focus:border-amber-500/50 outline-none"
          >
            <option value="ERC20">ERC20</option>
            <option value="BEP20">BEP20</option>
            <option value="TRC20">TRC20</option>
          </select>
          <input
            type="text"
            placeholder={t("address")}
            value={withdrawalAddress}
            onChange={(e) => setWithdrawalAddress(e.target.value)}
            className="w-full p-3 rounded-xl bg-slate-900/70 border border-slate-700/80 font-mono text-sm focus:border-amber-500/50 outline-none"
          />
          <button type="submit" disabled={isSubmitDisabled} className="w-full btn-primary py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
            {t("submit")}
          </button>
        </form>
        <Link href="/dashboard" className="mt-6 inline-block text-slate-400 hover:text-white text-sm">
          ← {tc("back")}
        </Link>
      </div>
    </div>
  );
}
