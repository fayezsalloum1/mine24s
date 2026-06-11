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
      <div className="bg-gray-800 rounded-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-yellow-500">{t("title")}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
        </div>

        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-2xl font-bold">
            ₮
          </div>
        </div>

        <label className="block text-gray-400 text-sm mb-2">{t("selectNetwork")}</label>
        <select
          value={network}
          onChange={(e) => setNetwork(e.target.value as Network)}
          className="w-full p-3 rounded bg-gray-700 text-white mb-4"
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
            <p className="text-gray-500 text-xs mb-1">
              {mode === "custom" ? t("platformAddress") : t("uniqueAddress")}
            </p>
            <div className="flex items-center gap-2 mb-4">
              <input
                readOnly
                value={address}
                className="flex-1 p-2 rounded bg-gray-700 text-white text-sm font-mono break-all"
              />
              <button
                onClick={copyAddress}
                disabled={!address}
                className="px-4 py-2 bg-yellow-500 text-black rounded font-bold text-sm hover:bg-yellow-400 disabled:opacity-50"
              >
                {copied ? tc("copied") : tc("copy")}
              </button>
            </div>

            {address && (
              <div className="flex justify-center mb-4 bg-white p-4 rounded-lg">
                <QRCode value={address} size={160} />
              </div>
            )}
          </>
        )}

        <p className="text-orange-400 text-sm text-center mb-4">{t("networkWarning")}</p>

        {mode === "custom" ? (
          <div className="space-y-3 border-t border-gray-700 pt-4">
            <p className="text-sm text-gray-400">{t("customWalletSteps")}</p>
            <input
              type="number"
              placeholder={t("depositAmount")}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-3 rounded bg-gray-700"
              step="0.01"
              min="0"
            />
            <input
              type="text"
              placeholder={t("txHash")}
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              className="w-full p-3 rounded bg-gray-700 font-mono text-sm"
            />
            {error && address && <p className="text-red-400 text-sm">{error}</p>}
            {success && <p className="text-green-400 text-sm">{success}</p>}
            <button
              type="button"
              onClick={submitDeposit}
              disabled={submitting || !amount || !txHash}
              className="w-full p-3 bg-yellow-500 text-black font-bold rounded hover:bg-yellow-400 disabled:opacity-50"
            >
              {submitting ? tc("loading") : t("iHaveSent")}
            </button>
          </div>
        ) : (
          <p className="text-gray-500 text-sm text-center">{t("autoDetect")}</p>
        )}
      </div>
    </div>
  );
}
