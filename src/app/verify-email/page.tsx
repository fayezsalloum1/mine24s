"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import { AuthButton, AuthField, AuthInput, AuthPanel } from "@/components/auth/AuthForm";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("auth");
  const tc = useTranslations("common");

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [expired, setExpired] = useState(false);
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    const fromUrl = searchParams.get("email");
    const stored = sessionStorage.getItem("verify_email");
    const notice = sessionStorage.getItem("verify_notice");
    setEmail((fromUrl || stored || "").trim().toLowerCase());
    if (notice) {
      setInfo(notice);
      sessionStorage.removeItem("verify_notice");
    }
  }, [searchParams]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (data.success) {
        sessionStorage.removeItem("verify_email");
        router.push("/login?verified=1");
        return;
      }
      setExpired(Boolean(data.expired));
      setLocked(Boolean(data.locked));
      setError(data.error || t("verificationFailed"));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setError("");
    setResent(false);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.error) {
        setLocked(Boolean(data.locked));
        setError(data.error);
      } else {
        setExpired(false);
        setResent(true);
      }
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthPanel>
      <h1 className="text-2xl font-bold text-white mb-2">{t("verifyEmailTitle")}</h1>
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

      {(expired || locked) && (
        <div className="mt-4 text-center">
          <AuthButton loading={resending} type="button" onClick={handleResend}>
            {t("resendVerification")}
          </AuthButton>
        </div>
      )}

      {!expired && !locked && (
        <p className="text-gray-500 text-sm text-center mt-4">
          {t("didntReceive")}{" "}
          <button type="button" onClick={handleResend} disabled={resending} className="text-yellow-500 hover:underline">
            {t("resendVerification")}
          </button>
        </p>
      )}

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
    <div className="page-shell bg-gray-950">
      <AppHeader showNotifications={false} />
      <div className="flex items-center justify-center p-6 min-h-[calc(100vh-64px)]">
        <Suspense fallback={<div className="text-white">{tc("loading")}</div>}>
          <VerifyEmailForm />
        </Suspense>
      </div>
    </div>
  );
}
