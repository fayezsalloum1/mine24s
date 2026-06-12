"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import AppHeader from "@/components/AppHeader";
import DashboardShell from "@/components/DashboardShell";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [userData, setUserData] = useState<any>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [setupCode, setSetupCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetch("/api/user/me").then((r) => r.json()).then((data) => {
        setUserData(data);
        setPhoneNumber(data.phoneNumber || "");
      });
    }
  }, [session]);

  const enable2FA = async () => {
    const res = await fetch("/api/auth/2fa/enable", { method: "POST" });
    const data = await res.json();
    if (data.qrDataUrl) setQrDataUrl(data.qrDataUrl);
  };

  const confirm2FA = async () => {
    const res = await fetch("/api/auth/2fa/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: setupCode }),
    });
    const data = await res.json();
    if (data.success) {
      setMessage("2FA enabled!");
      setQrDataUrl("");
      fetch("/api/user/me").then((r) => r.json()).then(setUserData);
    } else {
      setError(data.error);
    }
  };

  const disable2FA = async () => {
    const res = await fetch("/api/auth/2fa/disable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: disableCode }),
    });
    const data = await res.json();
    if (data.success) {
      setMessage("2FA disabled!");
      fetch("/api/user/me").then((r) => r.json()).then(setUserData);
    } else {
      setError(data.error);
    }
  };

  const sendOtp = async () => {
    const res = await fetch("/api/phone/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber }),
    });
    const data = await res.json();
    if (data.success) setMessage(t("otpSent"));
    else setError(data.error);
  };

  const verifyOtp = async () => {
    const res = await fetch("/api/phone/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: otpCode }),
    });
    const data = await res.json();
    if (data.success) {
      setMessage(t("otpVerified"));
      fetch("/api/user/me").then((r) => r.json()).then(setUserData);
    } else {
      setError(data.error);
    }
  };

  if (status === "loading") {
    return <div className="page-shell flex items-center justify-center">{tc("loading")}</div>;
  }

  return (
    <div className="page-shell">
      <AppHeader />
      <DashboardShell>
      <div className="page-content max-w-2xl">
        <h1 className="page-title">{t("title")}</h1>
        <p className="text-gray-400 mb-6">{userData?.email}</p>

        {message && <p className="text-green-400 mb-4">{message}</p>}
        {error && <p className="text-red-400 mb-4">{error}</p>}

        <div className="glass-panel p-5 sm:p-6 rounded-2xl mb-6">
          <h2 className="text-lg font-bold text-amber-400 mb-2">{t("twoFactor")}</h2>
          <p className="text-gray-400 text-sm mb-4">{t("twoFactorDesc")}</p>

          {userData?.twoFactorEnabled ? (
            <div>
              <p className="text-green-400 mb-4">2FA is enabled</p>
              <input
                type="text"
                placeholder={t("enterCode")}
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value)}
                className="w-full p-3 rounded bg-gray-700 mb-2"
              />
              <button onClick={disable2FA} className="px-4 py-2 bg-red-600 rounded hover:bg-red-500">
                {t("disable2fa")}
              </button>
            </div>
          ) : qrDataUrl ? (
            <div>
              <p className="text-gray-400 mb-4">{t("scanQr")}</p>
              <img src={qrDataUrl} alt="2FA QR" className="mx-auto mb-4 bg-white p-2 rounded" />
              <input
                type="text"
                placeholder={t("enterCode")}
                value={setupCode}
                onChange={(e) => setSetupCode(e.target.value)}
                className="w-full p-3 rounded bg-gray-700 mb-2"
              />
              <button onClick={confirm2FA} className="px-4 py-2 bg-green-600 rounded hover:bg-green-500">
                {tc("confirm")}
              </button>
            </div>
          ) : (
            <button onClick={enable2FA} className="px-4 py-2 bg-yellow-500 text-black rounded font-bold hover:bg-yellow-400">
              {t("enable2fa")}
            </button>
          )}
        </div>

        <div className="glass-panel p-5 sm:p-6 rounded-2xl">
          <h2 className="text-lg font-bold text-amber-400 mb-2">{t("phoneNumber")}</h2>
          <p className="text-gray-400 text-sm mb-4">{t("phoneDesc")}</p>
          {userData?.phoneVerified && (
            <p className="text-green-400 mb-4">{t("phoneVerified")}: {userData.phoneNumber}</p>
          )}
          {!userData?.phoneVerified && (
            <>
              <input
                type="tel"
                placeholder="+1234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full p-3 rounded bg-gray-700 mb-2"
              />
              <div className="flex gap-2 mb-4">
                <button onClick={sendOtp} className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500">
                  {t("sendOtp")}
                </button>
              </div>
              <input
                type="text"
                placeholder="OTP Code"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="w-full p-3 rounded bg-gray-700 mb-2"
              />
              <button onClick={verifyOtp} className="px-4 py-2 bg-green-600 rounded hover:bg-green-500">
                {t("verifyOtp")}
              </button>
            </>
          )}
        </div>
      </div>
      </DashboardShell>
    </div>
  );
}
