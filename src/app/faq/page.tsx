"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";

const FAQ_KEYS = ["q1", "q2", "q3", "q4", "q5", "q6"] as const;

export default function FaqPage() {
  const t = useTranslations("faq");
  const tc = useTranslations("common");

  return (
    <div className="page-shell text-white">
      <AppHeader showNotifications={false} />
      <div className="page-content max-w-3xl">
        <h1 className="page-title">{t("title")}</h1>
        <p className="text-slate-400 mb-6 sm:mb-8 text-sm sm:text-base">{t("subtitle")}</p>

        <div className="space-y-3">
          {FAQ_KEYS.map((key) => (
            <details key={key} className="content-card group">
              <summary className="cursor-pointer font-semibold text-amber-400/90 hover:text-amber-400 list-none flex justify-between items-center gap-3">
                <span className="text-sm sm:text-base">{t(`${key}`)}</span>
                <span className="text-slate-500 group-open:rotate-180 transition-transform shrink-0 text-xs">▼</span>
              </summary>
              <p className="pt-3 text-slate-400 text-sm leading-relaxed border-t border-slate-800/60 mt-3">
                {t(`${key}a`)}
              </p>
            </details>
          ))}
        </div>

        <Link href="/" className="mt-8 inline-block text-slate-400 hover:text-amber-400 text-sm transition-colors">
          ← {tc("back")}
        </Link>
      </div>
    </div>
  );
}
