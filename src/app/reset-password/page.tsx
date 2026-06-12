"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import { AuthButton, AuthField, AuthInput, AuthPanel } from "@/components/auth/AuthForm";
import { getPasswordStrength } from "@/lib/password-strength";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("auth");
  const tc = useTranslations("common");

  const token = searchParams.get("token") || "";
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  useEffect(() => {
    if (!token) {
      setValidating(false);
      return;
    }
    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => setTokenValid(Boolean(data.valid)))
      .finally(() => setValidating(false));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (password.length < 8) nextErrors.password = t("passwordMinLength");
    if (password !== confirmPassword) nextErrors.confirmPassword = t("passwordMismatch");
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (data.success) {
        router.push("/login?reset=1");
        return;
      }
      setErrors({ form: data.error || t("resetFailed") });
    } finally {
      setLoading(false);
    }
  }

  if (validating) {
    return <AuthPanel><p className="text-gray-400">{tc("loading")}</p></AuthPanel>;
  }

  if (!tokenValid) {
    return (
      <AuthPanel>
        <h1 className="auth-title mb-4">{t("resetPasswordTitle")}</h1>
        <p className="text-red-400 mb-4">{t("resetTokenInvalid")}</p>
        <Link href="/forgot-password" className="text-yellow-500 hover:underline text-sm">
          {t("requestNewReset")}
        </Link>
      </AuthPanel>
    );
  }

  return (
    <AuthPanel>
      <h1 className="auth-title mb-2">{t("resetPasswordTitle")}</h1>
      <p className="text-gray-400 text-sm mb-6">{t("resetPasswordDesc")}</p>

      {errors.form && <p className="text-red-400 text-sm mb-4">{errors.form}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField label={tc("password")} error={errors.password}>
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
          {strength && (
            <div className="mt-2">
              <div className="flex gap-1 mb-1">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded ${
                      (strength === "weak" && i === 1) ||
                      (strength === "medium" && i <= 2) ||
                      (strength === "strong" && i <= 3)
                        ? strength === "weak"
                          ? "bg-red-500"
                          : strength === "medium"
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        : "bg-gray-700"
                    }`}
                  />
                ))}
              </div>
              <p className={`text-xs ${strength === "weak" ? "text-red-400" : strength === "medium" ? "text-yellow-400" : "text-green-400"}`}>
                {t(`strength_${strength}`)}
              </p>
            </div>
          )}
        </AuthField>

        <AuthField label={t("confirmPassword")} error={errors.confirmPassword}>
          <AuthInput
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </AuthField>

        <AuthButton loading={loading} type="submit">
          {t("resetPassword")}
        </AuthButton>
      </form>
    </AuthPanel>
  );
}

export default function ResetPasswordPage() {
  const tc = useTranslations("common");
  return (
    <div className="page-shell">
      <AppHeader showNotifications={false} />
      <div className="auth-shell">
        <Suspense fallback={<div className="text-white">{tc("loading")}</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
