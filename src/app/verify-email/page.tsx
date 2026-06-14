"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import { AuthButton, AuthField, AuthInput, AuthPanel } from "@/components/auth/AuthForm";
import { createClient } from "@/lib/supabase/client";

const PROFILE_STORAGE_KEY = "mining-farm-register-profile";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("auth");
  const tc = useTranslations("common");

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    const fromUrl = searchParams.get("email");
    const stored = sessionStorage.getItem("verify_email");
    const resolved = (fromUrl || stored || "").trim().toLowerCase();
    setEmail(resolved);
  }, [searchParams]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      if (!supabase) {
        setError(t("serverError"));
        return;
      }

      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: code,
        type: "signup",
      });

      if (verifyError) {
        setError(verifyError.message || t("verificationFailed"));
        return;
      }

      const profileRaw = sessionStorage.getItem(PROFILE_STORAGE_KEY);
      const profile = profileRaw ? JSON.parse(profileRaw) : {};

      const setupRes = await fetch("/api/auth/setup-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      if (!setupRes.ok) {
        const setupData = await setupRes.json();
        setError(setupData.error || t("serverError"));
        return;
      }

      sessionStorage.removeItem("verify_email");
      sessionStorage.removeItem(PROFILE_STORAGE_KEY);
      router.push("/login?verified=1");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!email) return;
    setResending(true);
    setError("");
    setResent(false);

    try {
      const supabase = createClient();
      if (!supabase) {
        setError(t("serverError"));
        return;
      }

      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: email.trim().toLowerCase(),
      });

      if (resendError) {
        setError(resendError.message);
        return;
      }

      setResent(true);
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthPanel>
      <h1 className="auth-title mb-2">{t("verifyEmailTitle")}</h1>
      <p className="text-gray-400 text-sm mb-6">{t("verifyEmailDesc")}</p>

      {info && <p className="text-green-400 mb-4 text-sm">{info}</p>}
      {error && <p className="text-red-400 mb-4 text-sm">{error}</p>}
      {resent && <p className="text-green-400 mb-4 text-sm">{t("verificationSent")}</p>}

      <form onSubmit={handleVerify} className="space-y-4">
        <AuthField label={tc("email")}>
          <AuthInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value.trim().toLowerCase())}
            required
          />
        </AuthField>
        <AuthField label={t("verificationCode")}>
          <AuthInput
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="text-center text-2xl tracking-[0.5em] font-mono"
            required
          />
        </AuthField>
        <AuthButton loading={loading} type="submit">
          {t("verify")}
        </AuthButton>
      </form>

      <p className="text-gray-500 text-sm text-center mt-4">
        {t("didntReceive")}{" "}
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="text-yellow-500 hover:underline"
        >
          {t("resendVerification")}
        </button>
      </p>

      <p className="text-gray-400 mt-6 text-center text-sm">
        <Link href="/login" className="text-yellow-500 hover:underline">
          {t("backToLogin")}
        </Link>
      </p>
    </AuthPanel>
  );
}

export default function VerifyEmailPage() {
  const tc = useTranslations("common");
  return (
    <div className="page-shell">
      <AppHeader showNotifications={false} />
      <div className="auth-shell">
        <Suspense fallback={<div className="text-white">{tc("loading")}</div>}>
          <VerifyEmailForm />
        </Suspense>
      </div>
    </div>
  );
}
