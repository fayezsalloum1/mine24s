"use client";

import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import ReferralLinkActions from "@/components/ReferralLinkActions";
import { formatCountdown } from "@/lib/mining-math";
import { useMidnightCountdown } from "@/hooks/useMidnightCountdown";
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
}

export default function WithdrawPage() {
  const { status } = useSession();
  const router = useRouter();
  const t = useTranslations("withdraw");
  const tc = useTranslations("common");
  const td = useTranslations("dashboard");
  const countdown = useMidnightCountdown();
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
    const accrualFraction = 1 - countdown / 86400000;
    const liveAccruing = (data.totalDailyProfit ?? 0) * accrualFraction;
    const totalProfit = credited + liveAccruing;
    return Math.max(0, Math.min(data.balance - pending, totalProfit - pending));
  }, [data, countdown]);

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
        <div className="max-w-md mx-auto p-6 mt-12">
          <div className="bg-gray-800 p-8 rounded-lg">
            <h1 className="text-2xl font-bold text-red-400 mb-4 text-center">{t("lockedTitle")}</h1>
            <p className="text-gray-400 mb-6 text-center">{t("lockedMessage")}</p>
            <p className="text-sm text-gray-400 mb-2">{t("shareReferral")}</p>
            <ReferralLinkActions link={data.referralLink} />
            <Link href="/dashboard" className="mt-6 inline-block text-yellow-500 hover:underline">
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
      <div className="max-w-md mx-auto p-6">
        <h1 className="text-3xl font-bold text-yellow-500 mb-8">{t("title")}</h1>

        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <p className="text-gray-400">{t("availableProfit")}</p>
          <p className="text-2xl font-bold text-green-400">${availableProfit.toFixed(4)}</p>
          <div className="flex justify-between text-sm text-gray-500 mt-2">
            <span>
              {td("accruingNow")}: ${((data?.totalDailyProfit ?? 0) * (1 - countdown / 86400000)).toFixed(4)}
            </span>
            <span className="font-mono text-yellow-500">{formatCountdown(countdown)}</span>
          </div>
        </div>

        {(data?.pendingWithdrawalAmount ?? 0) > 0 && (
          <p className="text-gray-500 text-sm mb-4">
            {t("pendingWithdrawals")}: ${data?.pendingWithdrawalAmount?.toFixed(2)}
          </p>
        )}
        {error && <p className="text-red-400 mb-4">{error}</p>}
        {success && <p className="text-green-400 mb-4">{success}</p>}
        <form onSubmit={handleSubmit} className="space-y-4 bg-gray-800 p-6 rounded-lg">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm text-gray-400">{t("amount")}</label>
              <button
                type="button"
                onClick={handleMaxClick}
                className="text-xs text-yellow-500 hover:text-yellow-400"
              >
                {t("useMax")}
              </button>
            </div>
            <input
              type="number"
              placeholder={t("amount")}
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="w-full p-3 rounded bg-gray-700"
              step="0.01"
              min="0"
              max={availableProfit}
            />
            {isOverLimit && (
              <p className="text-red-400 text-sm mt-1">{t("exceedsProfit")}</p>
            )}
          </div>
          <select
            value={network}
            onChange={(e) => setNetwork(e.target.value)}
            className="w-full p-3 rounded bg-gray-700"
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
            className="w-full p-3 rounded bg-gray-700 font-mono text-sm"
          />
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="w-full p-3 bg-yellow-500 text-black font-bold rounded hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("submit")}
          </button>
        </form>
        <Link href="/dashboard" className="mt-6 inline-block text-gray-400 hover:text-white">
          ← {tc("back")}
        </Link>
      </div>
    </div>
  );
}
