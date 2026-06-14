"use client";

import { signIn } from "next-auth/react";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import AuthSplitLayout from "@/components/auth/AuthSplitLayout";
import { AuthButton, AuthField, AuthInput, AuthPanel } from "@/components/auth/AuthForm";
import SupabaseAuthButtons from "@/components/SupabaseAuthButtons";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("auth");
  const tc = useTranslations("common");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");

  useEffect(() => {
    if (searchParams.get("verified") === "1") setInfo(t("emailVerifiedSuccess"));
    if (searchParams.get("reset") === "1") setInfo(t("passwordResetSuccess"));

    const authError = searchParams.get("error");
    if (authError === "auth_failed") setError("Google sign-in failed. Please try again.");
    else if (authError === "google_access_denied") {
      setError(
        "Google blocked this sign-in. Your Google OAuth app is likely in Testing mode — publish it in Google Cloud Console, or add the user's Gmail under OAuth consent screen → Test users."
      );
    } else if (authError === "signup_disabled") {
      setError(
        "New Google sign-ups are blocked. In Supabase go to Authentication → Sign In / Providers → enable \"Allow new users to sign up\"."
      );
    } else if (authError === "wallet_not_configured") {
      setError(
        "Could not create your account — deposit wallet is not configured on the server. Set USE_CUSTOM_PLATFORM_WALLET + treasury addresses (or MASTER_WALLET_MNEMONIC) in Vercel."
      );
    } else if (authError === "supabase_not_configured") {
      setError("Google sign-in is not configured on the server. Add Supabase env vars in Vercel and redeploy.");
    }
    else if (authError === "account_setup_failed") {
      setError("Account setup failed. Please contact support.");
    } else if (authError === "missing_code") {
      setError("Sign-in link was invalid or expired.");
    }
  }, [searchParams, t]);

  async function handleResendVerification() {
    if (!unverifiedEmail) return;
    await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: unverifiedEmail }),
    });
    router.push(`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setUnverifiedEmail("");
    setLoading(true);

    try {
      const preRes = await fetch("/api/auth/pre-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const preData = await preRes.json();

      if (preData.frozen) {
        setError(t("accountFrozen"));
        return;
      }

      if (preData.emailUnverified) {
        setUnverifiedEmail(preData.email || email.trim().toLowerCase());
        setError(t("emailNotVerified"));
        return;
      }

      if (preData.error) {
        setError(t("invalidCredentials"));
        return;
      }

      if (preData.requires2FA) {
        sessionStorage.setItem("2fa_email", email.trim().toLowerCase());
        sessionStorage.setItem("2fa_password", password);
        router.push("/verify-2fa");
        return;
      }

      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        rememberMe: rememberMe ? "true" : "false",
        redirect: false,
      });

      if (res?.error) {
        setError(t("invalidCredentials"));
      } else {
        router.push("/dashboard");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPanel>
      <h1 className="auth-title">{t("loginTitle")}</h1>

      {info && <p className="text-green-400 mb-4 text-sm">{info}</p>}
      {error && <p className="text-red-400 mb-4 text-sm">{error}</p>}

      {unverifiedEmail && (
        <div className="glass-panel border border-amber-500/20 rounded-xl p-3 mb-4 text-sm space-y-2">
          <button
            type="button"
            onClick={handleResendVerification}
            className="text-amber-400 hover:underline block"
          >
            {t("resendVerificationLink")}
          </button>
          <Link href={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`} className="text-amber-400 hover:underline block">
            {t("verifyEmailTitle")} →
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField label={tc("email")}>
          <AuthInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </AuthField>

        <AuthField label={tc("password")}>
          <div className="relative">
            <AuthInput
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm hover:text-white"
            >
              {showPassword ? t("hidePassword") : t("showPassword")}
            </button>
          </div>
        </AuthField>

        <div className="flex items-center justify-between gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="accent-yellow-500"
            />
            <span className="text-sm text-gray-400">{t("rememberMe")}</span>
          </label>
          <Link href="/forgot-password" className="text-sm text-amber-400 hover:underline font-medium">
            {t("forgotPassword")}
          </Link>
        </div>

        <AuthButton loading={loading} type="submit">
          {tc("login")}
        </AuthButton>
      </form>
      <SupabaseAuthButtons />

      <p className="text-gray-400 mt-6 text-center text-sm">
        {t("noAccount")}{" "}
        <Link href="/register" className="text-amber-400 hover:underline">
          {tc("register")}
        </Link>
      </p>
    </AuthPanel>
  );
}

export default function LoginPage() {
  return (
    <div className="page-shell">
      <AppHeader showNotifications={false} />
      <AuthSplitLayout>
        <Suspense fallback={<div className="text-gray-400">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </AuthSplitLayout>
    </div>
  );
}
