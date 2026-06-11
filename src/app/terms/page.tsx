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
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-yellow-500 mb-2">{t("title")}</h1>
        <p className="text-gray-500 text-sm mb-8">{t("updated")}</p>

        <div className="space-y-6">
          {SECTIONS.map((key) => (
            <section key={key} className="glass-panel rounded-xl p-6 border border-gray-700/50">
              <h2 className="text-lg font-bold text-yellow-500/90 mb-2">{t(`${key}Title`)}</h2>
              <p className="text-gray-400 text-sm leading-relaxed">{t(`${key}Body`)}</p>
            </section>
          ))}
        </div>

        <Link href="/" className="mt-8 inline-block text-gray-400 hover:text-white">
          ← {tc("back")}
        </Link>
      </div>
    </div>
  );
}
