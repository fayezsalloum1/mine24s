"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import { AuthButton, AuthField, AuthInput, AuthPanel } from "@/components/auth/AuthForm";
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

  function validateField(field: string, value?: string) {
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
        return value ?? "";
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
    }
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
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
          acceptTerms,
        }),
      });
      const data = await res.json();
      if (data.error) {
        if (data.alreadyRegistered) {
          setFormError(data.error);
        } else {
          setFormError(data.error);
        }
        return;
      }
      localStorage.removeItem(REF_STORAGE_KEY);
      sessionStorage.setItem("verify_email", email.trim().toLowerCase());
      if (data.autoVerified || !data.requiresVerification) {
        router.push("/login?verified=1");
        return;
      }
      if (data.existingAccount) {
        sessionStorage.setItem("verify_notice", data.message || "");
      }
      router.push(`/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPanel>
      <h1 className="text-2xl font-bold text-white mb-2">{t("registerTitle")}</h1>
      <p className="text-gray-400 text-sm mb-6">{t("registerSubtitle")}</p>

      {formError && <p className="text-red-400 mb-4 text-sm">{formError}</p>}
      {formError && formError.includes("log in") && (
        <p className="text-yellow-500 mb-4 text-sm">
          <Link href="/login" className="hover:underline">{t("backToLogin")}</Link>
          {" · "}
          <Link href={`/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}`} className="hover:underline">
            {t("verifyEmailTitle")}
          </Link>
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField label={t("fullName")} error={touched.fullName ? errors.fullName : undefined}>
          <AuthInput
            type="text"
            value={fullName}
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => {
              setTouched((p) => ({ ...p, email: true }));
              setErrors((p) => ({ ...p, email: validateField("email") }));
            }}
            required
          />
        </AuthField>

        <AuthField label={t("phoneNumber")}>
          <AuthInput
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder={t("phoneOptional")}
          />
        </AuthField>

        <AuthField label={tc("password")} error={touched.password ? errors.password : undefined}>
          <div className="relative">
            <AuthInput
              type={showPassword ? "text" : "password"}
              value={password}
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

        <AuthField label={t("confirmPassword")} error={touched.confirmPassword ? errors.confirmPassword : undefined}>
          <AuthInput
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onBlur={() => {
              setTouched((p) => ({ ...p, confirmPassword: true }));
              setErrors((p) => ({ ...p, confirmPassword: validateField("confirmPassword") }));
            }}
            required
          />
        </AuthField>

        <AuthField label={t("referralCode")}>
          <AuthInput
            type="text"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
          />
          {referralCode && (
            <p className="text-xs text-green-400 mt-1">{t("referralApplied")}</p>
          )}
        </AuthField>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => {
              setAcceptTerms(e.target.checked);
              setTouched((p) => ({ ...p, acceptTerms: true }));
              setErrors((p) => ({ ...p, acceptTerms: e.target.checked ? "" : t("termsRequired") }));
            }}
            className="mt-1 accent-yellow-500"
          />
          <span className="text-sm text-gray-400">
            {t("acceptTerms")}{" "}
            <Link href="/terms" target="_blank" className="text-yellow-500 hover:underline">
              {t("termsOfService")}
            </Link>
          </span>
        </label>
        {touched.acceptTerms && errors.acceptTerms && (
          <p className="text-red-400 text-xs -mt-2">{errors.acceptTerms}</p>
        )}

        <AuthButton loading={loading} type="submit">
          {tc("register")}
        </AuthButton>
      </form>

      <p className="text-gray-400 mt-6 text-center text-sm">
        {t("haveAccount")}{" "}
        <Link href="/login" className="text-yellow-500 hover:underline">
          {tc("login")}
        </Link>
      </p>
    </AuthPanel>
  );
}

export default function RegisterPage() {
  const tc = useTranslations("common");
  return (
    <div className="page-shell bg-gray-950">
      <AppHeader showNotifications={false} />
      <div className="flex items-center justify-center p-6 min-h-[calc(100vh-64px)]">
        <Suspense fallback={<div className="text-white">{tc("loading")}</div>}>
          <RegisterForm />
        </Suspense>
      </div>
    </div>
  );
}
