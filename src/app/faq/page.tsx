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
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-yellow-500 mb-2">{t("title")}</h1>
        <p className="text-gray-400 mb-8">{t("subtitle")}</p>

        <div className="space-y-4">
          {FAQ_KEYS.map((key) => (
            <details key={key} className="glass-panel rounded-xl border border-gray-700/50 group">
              <summary className="p-4 cursor-pointer font-medium text-yellow-500/90 hover:text-yellow-500 list-none flex justify-between items-center">
                {t(`${key}`)}
                <span className="text-gray-500 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="px-4 pb-4 text-gray-400 text-sm leading-relaxed">{t(`${key}a`)}</p>
            </details>
          ))}
        </div>

        <Link href="/" className="mt-8 inline-block text-gray-400 hover:text-white">
          ← {tc("back")}
        </Link>
      </div>
    </div>
  );
}
