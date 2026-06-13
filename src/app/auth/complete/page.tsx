"use client";

import { signIn } from "next-auth/react";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import AppHeader from "@/components/AppHeader";
import AuthSplitLayout from "@/components/auth/AuthSplitLayout";
import { AuthPanel } from "@/components/auth/AuthForm";

function CompleteAuthForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tc = useTranslations("common");
  const [error, setError] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    const next = searchParams.get("next") ?? "/dashboard";
    if (!token) {
      setError("Sign-in link is invalid or expired.");
      return;
    }

    let cancelled = false;

    signIn("credentials", {
      supabaseToken: token,
      redirect: false,
    }).then((res) => {
      if (cancelled) return;
      if (res?.error) {
        setError("Sign-in failed. Please try again.");
        setTimeout(() => router.replace("/login?error=auth_failed"), 3000);
      } else {
        router.replace(next.startsWith("/") ? next : "/dashboard");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [searchParams, router]);

  return (
    <AuthPanel>
      <h1 className="auth-title text-center">{tc("loading")}</h1>
      {error ? (
        <p className="text-red-400 text-sm text-center mt-4">{error}</p>
      ) : (
        <p className="text-gray-400 text-sm text-center mt-4">Completing sign-in…</p>
      )}
    </AuthPanel>
  );
}

export default function CompleteAuthPage() {
  const tc = useTranslations("common");
  return (
    <div className="page-shell">
      <AppHeader showNotifications={false} />
      <AuthSplitLayout>
        <Suspense fallback={<div className="text-gray-400 text-center">{tc("loading")}</div>}>
          <CompleteAuthForm />
        </Suspense>
      </AuthSplitLayout>
    </div>
  );
}
