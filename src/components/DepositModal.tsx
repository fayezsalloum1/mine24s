"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import QRCode from "react-qr-code";

type Network = "ERC20" | "BEP20" | "TRC20";

interface DepositModalProps {
  open: boolean;
  onClose: () => void;
  onDepositDetected?: () => void;
}

export default function DepositModal({ open, onClose, onDepositDetected }: DepositModalProps) {
  const t = useTranslations("deposit");
  const tc = useTranslations("common");
  const [network, setNetwork] = useState<Network>("ERC20");
  const [address, setAddress] = useState("");
  const [mode, setMode] = useState<"custom" | "hd">("hd");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [initialBalance, setInitialBalance] = useState<number | null>(null);

  const fetchAddress = useCallback(async (net: Network) => {
    setLoading(true);
    setError("");
    setAddress("");
    try {
      const res = await fetch(`/api/deposit/address?network=${net}`);
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Failed to load address");
        return;
      }
      if (data.address) {
        setAddress(data.address);
        setMode(data.mode === "custom" ? "custom" : "hd");
      } else {
        setError("No address returned");
      }
    } catch {
      setError("Failed to load address");
    } finally {
      setLoading(false);
    }
  }, []);

  const checkBalance = useCallback(async () => {
    const res = await fetch("/api/user/me");
    const data = await res.json();
    if (initialBalance !== null && data.balance > initialBalance) {
      onDepositDetected?.();
    }
    return data.balance as number;
  }, [initialBalance, onDepositDetected]);

  useEffect(() => {
    if (open) {
      setSuccess("");
      setAmount("");
      setTxHash("");
      fetchAddress(network);
      fetch("/api/user/me")
        .then((r) => r.json())
        .then((d) => setInitialBalance(d.balance ?? 0));
    }
  }, [open, network, fetchAddress]);

  useEffect(() => {
    if (!open || mode === "custom") return;
    const interval = setInterval(() => {
      checkBalance();
    }, 15000);
    return () => clearInterval(interval);
  }, [open, mode, checkBalance]);

  const copyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const submitDeposit = async () => {
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/deposit/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(amount),
          network,
          txHash: txHash.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit deposit");
        return;
      }
      setSuccess(data.message || t("depositPending"));
      setAmount("");
      setTxHash("");
    } catch {
      setError("Failed to submit deposit");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="glass-panel rounded-2xl w-full max-w-md p-5 sm:p-6 max-h-[90vh] overflow-y-auto shadow-panel animate-slide-up">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gradient-gold">{t("title")}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800/60 transition-colors">✕</button>
        </div>

        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-emerald-500 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg shadow-emerald-500/20">
            ₮
          </div>
        </div>

        <label className="form-label">{t("selectNetwork")}</label>
        <select
          value={network}
          onChange={(e) => setNetwork(e.target.value as Network)}
          className="form-input mb-4"
        >
          <option value="ERC20">{t("networks.ERC20")}</option>
          <option value="BEP20">{t("networks.BEP20")}</option>
          <option value="TRC20">{t("networks.TRC20")}</option>
        </select>

        {loading ? (
          <p className="text-center text-gray-400 py-4">{tc("loading")}</p>
        ) : error && !address ? (
          <p className="text-center text-red-400 py-4">{error}</p>
        ) : (
          <>
            <p className="text-slate-500 text-xs mb-1">
              {mode === "custom" ? t("platformAddress") : t("uniqueAddress")}
            </p>
            <div className="flex items-center gap-2 mb-4">
              <input
                readOnly
                value={address}
                className="flex-1 p-2.5 rounded-xl bg-slate-900/70 border border-slate-700/60 text-white text-xs sm:text-sm font-mono break-all"
              />
              <button
                onClick={copyAddress}
                disabled={!address}
                className="px-4 py-2.5 btn-primary rounded-xl text-sm disabled:opacity-50 disabled:transform-none"
              >
                {copied ? tc("copied") : tc("copy")}
              </button>
            </div>

            {address && (
              <div className="flex justify-center mb-4 bg-white p-4 rounded-xl">
                <QRCode value={address} size={160} />
              </div>
            )}
          </>
        )}

        <p className="text-orange-400 text-sm text-center mb-4">{t("networkWarning")}</p>

        {mode === "custom" ? (
          <div className="space-y-3 border-t border-slate-700/60 pt-4">
            <p className="text-sm text-slate-400">{t("customWalletSteps")}</p>
            <input
              type="number"
              placeholder={t("depositAmount")}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="form-input"
              step="0.01"
              min="0"
            />
            <input
              type="text"
              placeholder={t("txHash")}
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              className="form-input font-mono"
            />
            {error && address && <p className="text-red-400 text-sm">{error}</p>}
            {success && <p className="text-emerald-400 text-sm">{success}</p>}
            <button
              type="button"
              onClick={submitDeposit}
              disabled={submitting || !amount || !txHash}
              className="w-full btn-primary py-3 rounded-xl disabled:opacity-50 disabled:transform-none"
            >
              {submitting ? tc("loading") : t("iHaveSent")}
            </button>
          </div>
        ) : (
          <p className="text-slate-500 text-sm text-center">{t("autoDetect")}</p>
        )}
      </div>
    </div>
  );
}
