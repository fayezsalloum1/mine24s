"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import AppHeader from "@/components/AppHeader";
import { AuthButton, AuthPanel } from "@/components/auth/AuthForm";

export default function Verify2FAPage() {
  const router = useRouter();
  const t = useTranslations("auth");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("2fa_email");
    const storedPassword = sessionStorage.getItem("2fa_password");
    if (!storedEmail || !storedPassword) {
      router.push("/login");
      return;
    }
    setEmail(storedEmail);
    setPassword(storedPassword);
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const verifyRes = await fetch("/api/auth/2fa/verify-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, code }),
      });
      const verifyData = await verifyRes.json();

      if (verifyData.error) {
        setError(verifyData.error);
        return;
      }

      const res = await signIn("credentials", {
        email,
        password,
        twoFactorVerified: "true",
        redirect: false,
      });

      sessionStorage.removeItem("2fa_email");
      sessionStorage.removeItem("2fa_password");

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
    <div className="page-shell">
      <AppHeader showNotifications={false} />
      <div className="auth-shell">
        <AuthPanel>
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-2xl mb-4">
              🔐
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">{t("verify2faTitle")}</h1>
            <p className="text-slate-400 text-sm mt-2">{t("verify2faDesc")}</p>
          </div>
          {error && <p className="text-red-400 mb-4 text-sm text-center">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder={t("verificationCode")}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
              className="w-full p-4 rounded-xl bg-slate-950/70 border border-slate-700/80 text-white text-center text-2xl tracking-[0.5em] font-mono focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/15 outline-none"
            />
            <AuthButton loading={loading} type="submit">
              {t("verify")}
            </AuthButton>
          </form>
        </AuthPanel>
      </div>
    </div>
  );
}
