"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import { AuthButton, AuthField, AuthInput, AuthPanel } from "@/components/auth/AuthForm";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (data.error && !data.success) {
        setError(data.error);
        return;
      }
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-shell bg-gray-950">
      <AppHeader showNotifications={false} />
      <div className="flex items-center justify-center p-6 min-h-[calc(100vh-64px)]">
        <AuthPanel>
          <h1 className="text-2xl font-bold text-white mb-2">{t("forgotPasswordTitle")}</h1>
          <p className="text-gray-400 text-sm mb-6">{t("forgotPasswordDesc")}</p>

          {sent ? (
            <div className="space-y-4">
              <p className="text-green-400 text-sm">{t("resetEmailSent")}</p>
              <Link href="/login" className="block text-center text-yellow-500 hover:underline text-sm">
                {t("backToLogin")}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <AuthField label={tc("email")}>
                <AuthInput
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </AuthField>
              <AuthButton loading={loading} type="submit">
                {t("sendResetLink")}
              </AuthButton>
              <p className="text-center text-sm">
                <Link href="/login" className="text-yellow-500 hover:underline">
                  {t("backToLogin")}
                </Link>
              </p>
            </form>
          )}
        </AuthPanel>
      </div>
    </div>
  );
}
