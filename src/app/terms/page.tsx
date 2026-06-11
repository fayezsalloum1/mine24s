"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";

const SECTIONS = ["s1", "s2", "s3", "s4", "s5"] as const;

export default function TermsPage() {
  const t = useTranslations("terms");
  const tc = useTranslations("common");

  return (
    <div className="page-shell text-white">
      <AppHeader showNotifications={false} />
      <div className="page-content max-w-3xl">
        <h1 className="page-title">{t("title")}</h1>
        <p className="text-slate-500 text-xs sm:text-sm mb-6 sm:mb-8">{t("updated")}</p>

        <div className="space-y-4">
          {SECTIONS.map((key) => (
            <section key={key} className="content-card">
              <h2 className="text-base sm:text-lg font-bold text-amber-400/90 mb-2">{t(`${key}Title`)}</h2>
              <p className="text-slate-400 text-sm leading-relaxed">{t(`${key}Body`)}</p>
            </section>
          ))}
        </div>

        <Link href="/" className="mt-8 inline-block text-slate-400 hover:text-amber-400 text-sm transition-colors">
          ← {tc("back")}
        </Link>
      </div>
    </div>
  );
}
