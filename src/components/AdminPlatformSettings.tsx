"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export default function AdminPlatformSettings() {
  const t = useTranslations("admin");
  const [requireReferral, setRequireReferral] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.requireReferralForWithdrawal === "boolean") {
          setRequireReferral(data.requireReferralForWithdrawal);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function save(next: boolean) {
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requireReferralForWithdrawal: next }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setMessage(data.error || t("settingsSaveFailed"));
      return;
    }
    setRequireReferral(data.requireReferralForWithdrawal);
    setMessage(t("settingsSaved"));
  }

  return (
    <div className="admin-panel mb-6">
      <h2 className="text-lg sm:text-xl font-bold text-amber-400 mb-2">{t("platformSettings")}</h2>
      <p className="text-sm text-gray-400 mb-4">{t("platformSettingsHint")}</p>

      {loading ? (
        <p className="text-gray-500 text-sm">{t("loadingSettings")}</p>
      ) : (
        <div className="glass-card p-5 sm:p-6 max-w-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="font-semibold text-gray-100 mb-1">{t("requireReferralWithdrawal")}</p>
              <p className="text-sm text-gray-400 leading-relaxed">
                {requireReferral ? t("requireReferralOnDesc") : t("requireReferralOffDesc")}
              </p>
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={() => save(!requireReferral)}
              className={`shrink-0 relative w-14 h-8 rounded-full transition-colors ${
                requireReferral ? "bg-emerald-600" : "bg-gray-600"
              } ${saving ? "opacity-60" : ""}`}
              aria-pressed={requireReferral}
              aria-label={t("requireReferralWithdrawal")}
            >
              <span
                className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                  requireReferral ? "left-7" : "left-1"
                }`}
              />
            </button>
          </div>
          <p className="text-xs text-gold-400/90 mt-4 border-t border-gray-800 pt-3">
            {t("referralCommissionNote")}
          </p>
          {message && <p className="text-sm text-emerald-400 mt-3">{message}</p>}
        </div>
      )}
    </div>
  );
}
