"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import { AuthButton, AuthField, AuthInput, AuthPanel } from "@/components/auth/AuthForm";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

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
      if (!isSupabaseConfigured()) {
        setError("Password reset is not configured. Add SUPABASE_PUBLIC in your environment.");
        return;
      }

      const supabase = createClient();
      if (!supabase) {
        setError("Password reset is not configured.");
        return;
      }

      const redirectTo = `${window.location.origin}/auth/callback?type=recovery&next=/reset-password`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo }
      );

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-shell">
      <AppHeader showNotifications={false} />
      <div className="auth-shell">
        <AuthPanel>
          <h1 className="auth-title mb-2">{t("forgotPasswordTitle")}</h1>
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
