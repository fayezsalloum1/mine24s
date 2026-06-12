"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import AuthSplitLayout from "@/components/auth/AuthSplitLayout";
import {
  AuthAlert,
  AuthButton,
  AuthField,
  AuthInput,
  AuthPanel,
} from "@/components/auth/AuthForm";
import { getPasswordStrength, isValidEmail } from "@/lib/password-strength";

const REF_STORAGE_KEY = "mining-farm-ref";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("auth");
  const tc = useTranslations("common");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  useEffect(() => {
    const fromUrl = searchParams.get("ref");
    if (fromUrl) {
      const normalized = fromUrl.trim().toUpperCase();
      setReferralCode(normalized);
      localStorage.setItem(REF_STORAGE_KEY, normalized);
      return;
    }
    const stored = localStorage.getItem(REF_STORAGE_KEY);
    if (stored) setReferralCode(stored);
  }, [searchParams]);

  function validateField(field: string) {
    switch (field) {
      case "fullName":
        return !fullName.trim() ? t("fullNameRequired") : "";
      case "email":
        if (!email.trim()) return t("emailRequired");
        if (!isValidEmail(email.trim())) return t("emailInvalid");
        return "";
      case "password":
        return password.length < 8 ? t("passwordMinLength") : "";
      case "confirmPassword":
        return password !== confirmPassword ? t("passwordMismatch") : "";
      case "acceptTerms":
        return !acceptTerms ? t("termsRequired") : "";
      default:
        return "";
    }
  }

  function validateAll() {
    const fields = ["fullName", "email", "password", "confirmPassword", "acceptTerms"] as const;
    const next: Record<string, string> = {};
    fields.forEach((field) => {
      const err = validateField(field);
      if (err) next[field] = err;
    });
    setErrors(next);
    setTouched(Object.fromEntries(fields.map((f) => [f, true])));
    if (Object.keys(next).length > 0) {
      setFormError(t("fixFormErrors"));
      return false;
    }
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setAlreadyRegistered(false);
    if (!validateAll()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          phoneNumber: phoneNumber.trim() || undefined,
          password,
          referralCode: referralCode.trim().toUpperCase() || undefined,
          acceptTerms: true,
        }),
      });

      let data: Record<string, unknown> = {};
      try {
        data = await res.json();
      } catch {
        setFormError(t("serverError"));
        return;
      }

      if (data.error) {
        setFormError(String(data.error));
        setAlreadyRegistered(Boolean(data.alreadyRegistered));
        return;
      }

      if (!data.success) {
        setFormError(t("serverError"));
        return;
      }

      localStorage.removeItem(REF_STORAGE_KEY);
      sessionStorage.setItem("verify_email", email.trim().toLowerCase());

      if (data.autoVerified || !data.requiresVerification) {
        router.push("/login?verified=1");
        return;
      }

      if (data.existingAccount && data.message) {
        sessionStorage.setItem("verify_notice", String(data.message));
      }
      router.push(`/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}`);
    } catch {
      setFormError(t("networkError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPanel wide>
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-yellow-500/10 border border-yellow-500/30 mb-4">
          <span className="text-2xl">⛏️</span>
        </div>
        <h1 className="auth-title">{t("registerTitle")}</h1>
        <p className="text-gray-400 text-sm mt-2">{t("registerSubtitle")}</p>
      </div>

      {formError && (
        <AuthAlert type="error">
          {formError}
          {alreadyRegistered && (
            <div className="mt-3 flex flex-wrap gap-3">
              <Link href="/login" className="text-yellow-400 hover:underline font-medium">
                {t("backToLogin")} →
              </Link>
              <Link href="/forgot-password" className="text-yellow-400 hover:underline font-medium">
                {t("forgotPassword")} →
              </Link>
            </div>
          )}
        </AuthAlert>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthField label={t("fullName")} error={touched.fullName ? errors.fullName : undefined}>
          <AuthInput
            type="text"
            placeholder="John Smith"
            value={fullName}
            aria-invalid={Boolean(touched.fullName && errors.fullName)}
            onChange={(e) => setFullName(e.target.value)}
            onBlur={() => {
              setTouched((p) => ({ ...p, fullName: true }));
              setErrors((p) => ({ ...p, fullName: validateField("fullName") }));
            }}
            required
          />
        </AuthField>

        <AuthField label={tc("email")} error={touched.email ? errors.email : undefined}>
          <AuthInput
            type="email"
            placeholder="you@example.com"
            value={email}
            aria-invalid={Boolean(touched.email && errors.email)}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => {
              setTouched((p) => ({ ...p, email: true }));
              setErrors((p) => ({ ...p, email: validateField("email") }));
            }}
            required
          />
        </AuthField>

        <AuthField label={t("phoneNumber")} hint={t("phoneOptional")}>
          <AuthInput
            type="tel"
            placeholder="+1 234 567 8900"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
        </AuthField>

        <AuthField label={tc("password")} error={touched.password ? errors.password : undefined}>
          <div className="relative">
            <AuthInput
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              aria-invalid={Boolean(touched.password && errors.password)}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => {
                setTouched((p) => ({ ...p, password: true }));
                setErrors((p) => ({ ...p, password: validateField("password") }));
              }}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs hover:text-white px-1"
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
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      (strength === "weak" && i === 1) ||
                      (strength === "medium" && i <= 2) ||
                      (strength === "strong" && i <= 3)
                        ? strength === "weak"
                          ? "bg-red-500"
                          : strength === "medium"
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        : "bg-gray-800"
                    }`}
                  />
                ))}
              </div>
              <p
                className={`text-xs ${
                  strength === "weak"
                    ? "text-red-400"
                    : strength === "medium"
                      ? "text-yellow-400"
                      : "text-green-400"
                }`}
              >
                {t(`strength_${strength}`)}
              </p>
            </div>
          )}
        </AuthField>

        <AuthField
          label={t("confirmPassword")}
          error={touched.confirmPassword ? errors.confirmPassword : undefined}
        >
          <AuthInput
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={confirmPassword}
            aria-invalid={Boolean(touched.confirmPassword && errors.confirmPassword)}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onBlur={() => {
              setTouched((p) => ({ ...p, confirmPassword: true }));
              setErrors((p) => ({ ...p, confirmPassword: validateField("confirmPassword") }));
            }}
            required
          />
        </AuthField>

        <AuthField label={t("referralCode")} hint={t("referralOptional")}>
          <AuthInput
            type="text"
            placeholder="ABC123XY"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
          />
          {referralCode && (
            <p className="text-xs text-green-400 mt-1.5">{t("referralApplied")}</p>
          )}
        </AuthField>

        <div
          className={`rounded-xl border p-4 transition-colors ${
            touched.acceptTerms && errors.acceptTerms
              ? "border-red-500/50 bg-red-950/20"
              : "border-slate-700/60 bg-slate-950/40"
          }`}
        >
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => {
                setAcceptTerms(e.target.checked);
                setTouched((p) => ({ ...p, acceptTerms: true }));
                setErrors((p) => ({
                  ...p,
                  acceptTerms: e.target.checked ? "" : t("termsRequired"),
                }));
                if (e.target.checked) setFormError("");
              }}
              className="mt-0.5 w-4 h-4 accent-yellow-500 shrink-0"
            />
            <span className="text-sm text-gray-300 leading-relaxed">
              {t("acceptTerms")}{" "}
              <Link href="/terms" target="_blank" className="text-amber-400 hover:underline">
                {t("termsOfService")}
              </Link>
            </span>
          </label>
          {touched.acceptTerms && errors.acceptTerms && (
            <p className="text-red-400 text-xs mt-2 ml-7">{errors.acceptTerms}</p>
          )}
        </div>

        <AuthButton loading={loading} type="submit">
          {tc("register")}
        </AuthButton>
      </form>

      <p className="text-gray-400 mt-8 text-center text-sm">
        {t("haveAccount")}{" "}
        <Link href="/login" className="text-amber-400 hover:underline font-medium">
          {tc("login")}
        </Link>
      </p>
    </AuthPanel>
  );
}

export default function RegisterPage() {
  const tc = useTranslations("common");
  return (
    <div className="page-shell">
      <AppHeader showNotifications={false} />
      <AuthSplitLayout>
        <Suspense fallback={<div className="text-gray-400">{tc("loading")}</div>}>
          <RegisterForm />
        </Suspense>
      </AuthSplitLayout>
    </div>
  );
}
