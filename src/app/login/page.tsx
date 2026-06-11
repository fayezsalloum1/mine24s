"use client";

import { signIn } from "next-auth/react";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import { AuthButton, AuthField, AuthInput, AuthPanel } from "@/components/auth/AuthForm";

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
      <h1 className="text-2xl font-bold text-white mb-6">{t("loginTitle")}</h1>

      {info && <p className="text-green-400 mb-4 text-sm">{info}</p>}
      {error && <p className="text-red-400 mb-4 text-sm">{error}</p>}

      {unverifiedEmail && (
        <div className="bg-gray-800 border border-yellow-500/30 rounded-lg p-3 mb-4 text-sm">
          <button
            type="button"
            onClick={handleResendVerification}
            className="text-yellow-500 hover:underline"
          >
            {t("resendVerificationLink")}
          </button>
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
          <div className="mt-1 text-right">
            <Link href="/forgot-password" className="text-xs text-yellow-500 hover:underline">
              {t("forgotPassword")}
            </Link>
          </div>
        </AuthField>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="accent-yellow-500"
          />
          <span className="text-sm text-gray-400">{t("rememberMe")}</span>
        </label>

        <AuthButton loading={loading} type="submit">
          {tc("login")}
        </AuthButton>
      </form>

      <p className="text-gray-400 mt-6 text-center text-sm">
        {t("noAccount")}{" "}
        <Link href="/register" className="text-yellow-500 hover:underline">
          {tc("register")}
        </Link>
      </p>
    </AuthPanel>
  );
}

export default function LoginPage() {
  return (
    <div className="page-shell bg-gray-950">
      <AppHeader showNotifications={false} />
      <div className="flex items-center justify-center p-6 min-h-[calc(100vh-64px)]">
        <Suspense fallback={<div className="text-white">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
