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
      <div className="page-content max-w-3xl text-center py-8 sm:py-16">
        <div className="content-card">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-3xl mb-6">
            ⛏️
          </div>
          <h1 className="page-title">{t("aboutTitle")}</h1>
          <p className="text-slate-400 text-base sm:text-lg mb-8 leading-relaxed">{t("comingSoon")}</p>
          <Link href="/" className="btn-secondary px-6 py-2.5 rounded-xl text-sm inline-flex">
            ← {tc("back")}
          </Link>
        </div>
      </div>
    </div>
  );
}
