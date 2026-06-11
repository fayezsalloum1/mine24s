"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState(searchParams.get("ref") || "");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, referralCode: referralCode || undefined }),
    });
    const data = await res.json();
    if (data.error) {
      setError(data.error);
    } else {
      router.push("/login");
    }
  }

  return (
    <div className="glass-panel p-8 rounded-lg w-full max-w-md">
      <h1 className="text-2xl font-bold text-white mb-6">{t("registerTitle")}</h1>
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
        <input
          type="text"
          placeholder={t("referralCode")}
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value)}
          className="w-full p-3 rounded bg-gray-700 text-white"
        />
        <button
          type="submit"
          className="w-full p-3 bg-yellow-500 text-black font-bold rounded hover:bg-yellow-400"
        >
          {tc("register")}
        </button>
      </form>
      <p className="text-gray-400 mt-4 text-center">
        {t("haveAccount")}{" "}
        <Link href="/login" className="text-yellow-500 hover:underline">
          {tc("login")}
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  const tc = useTranslations("common");

  return (
    <div className="page-shell">
      <AppHeader showNotifications={false} />
      <div className="flex items-center justify-center p-6">
        <Suspense fallback={<div className="text-white">{tc("loading")}</div>}>
          <RegisterForm />
        </Suspense>
      </div>
    </div>
  );
}
