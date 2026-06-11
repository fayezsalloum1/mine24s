"use client";

import { useTranslations } from "next-intl";
import AppHeader from "@/components/AppHeader";
import Link from "next/link";

export default function AboutPage() {
  const t = useTranslations("pages");
  const tc = useTranslations("common");

  return (
    <div className="page-shell text-white">
      <AppHeader showNotifications={false} />
      <div className="max-w-3xl mx-auto p-6 py-16 text-center">
        <h1 className="text-4xl font-bold text-yellow-500 mb-6">{t("aboutTitle")}</h1>
        <p className="text-gray-400 text-lg mb-8">{t("comingSoon")}</p>
        <Link href="/" className="text-yellow-500 hover:underline">{tc("back")}</Link>
      </div>
    </div>
  );
}
