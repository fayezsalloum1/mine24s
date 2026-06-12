"use client";

import { useTranslations } from "next-intl";
import BrandVideo from "@/components/BrandVideo";
import { SITE_VIDEOS } from "@/lib/site-videos";

export default function CompanyVideoSection() {
  const t = useTranslations("landing");

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
      <div className="company-video-grid">
        <div className="flex flex-col justify-center">
          <p className="iconic-badge mb-4 w-fit">{t("operationsBadge")}</p>
          <h2 className="section-title mb-4 text-start">{t("operationsTitle")}</h2>
          <p className="text-gray-400 leading-relaxed mb-6">{t("operationsDesc")}</p>
          <ul className="space-y-3 text-sm text-gray-300">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 text-gold-400">◆</span>
              {t("operationsPoint1")}
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 text-gold-400">◆</span>
              {t("operationsPoint2")}
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 text-gold-400">◆</span>
              {t("operationsPoint3")}
            </li>
          </ul>
        </div>

        <BrandVideo
          src={SITE_VIDEOS.operations}
          title={t("operationsTitle")}
          className="company-video-player rounded-2xl border border-gray-800/80 shadow-2xl shadow-black/40"
          fallback={
            <div className="company-video-player flex items-center justify-center rounded-2xl border border-dashed border-gray-700 bg-navy-800/60">
              <div className="px-6 text-center">
                <p className="text-gold-400 text-sm font-semibold mb-2">{t("videoPlaceholderTitle")}</p>
                <p className="text-gray-500 text-xs leading-relaxed">{t("videoPlaceholderHint")}</p>
              </div>
            </div>
          }
        />
      </div>
    </section>
  );
}
