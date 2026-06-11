"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const preRes = await fetch("/api/auth/pre-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const preData = await preRes.json();

    if (preData.frozen) {
      setError(t("accountFrozen"));
      return;
    }

    if (preData.error) {
      setError(t("invalidCredentials"));
      return;
    }

    if (preData.requires2FA) {
      sessionStorage.setItem("2fa_email", email);
      sessionStorage.setItem("2fa_password", password);
      router.push("/verify-2fa");
      return;
    }

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

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
        <div className="glass-panel p-8 rounded-lg w-full max-w-md">
          <h1 className="text-2xl font-bold text-white mb-6">{t("loginTitle")}</h1>
          {error && <p className="text-red-400 mb-4">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder={tc("email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded bg-gray-700 text-white"
            />
            <input
              type="password"
              placeholder={tc("password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded bg-gray-700 text-white"
            />
            <button
              type="submit"
              className="w-full p-3 bg-yellow-500 text-black font-bold rounded hover:bg-yellow-400"
            >
              {tc("login")}
            </button>
          </form>
          <p className="text-gray-400 mt-4 text-center">
            {t("noAccount")}{" "}
            <Link href="/register" className="text-yellow-500 hover:underline">
              {tc("register")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
