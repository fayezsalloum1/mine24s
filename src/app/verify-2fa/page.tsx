"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import AppHeader from "@/components/AppHeader";

export default function Verify2FAPage() {
  const router = useRouter();
  const t = useTranslations("auth");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
  }

  return (
    <div className="page-shell">
      <AppHeader showNotifications={false} />
      <div className="flex items-center justify-center p-6">
        <div className="bg-gray-800 p-8 rounded-lg w-full max-w-md">
          <h1 className="text-2xl font-bold text-white mb-2">{t("verify2faTitle")}</h1>
          <p className="text-gray-400 mb-6">{t("verify2faDesc")}</p>
          {error && <p className="text-red-400 mb-4">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder={t("verificationCode")}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
              className="w-full p-3 rounded bg-gray-700 text-white text-center text-2xl tracking-widest"
            />
            <button
              type="submit"
              className="w-full p-3 bg-yellow-500 text-black font-bold rounded hover:bg-yellow-400"
            >
              {t("verify")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
