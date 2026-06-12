"use client";

import { useTranslations } from "next-intl";
import AppHeader from "@/components/AppHeader";
import BrandLogo from "@/components/BrandLogo";
import BrandVideo from "@/components/BrandVideo";
import Link from "next/link";
import { SITE_VIDEOS } from "@/lib/site-videos";

const VALUES = [
  { titleKey: "aboutValue1Title" as const, descKey: "aboutValue1Desc" as const },
  { titleKey: "aboutValue2Title" as const, descKey: "aboutValue2Desc" as const },
  { titleKey: "aboutValue3Title" as const, descKey: "aboutValue3Desc" as const },
];

export default function AboutPage() {
  const t = useTranslations("pages");
  const tc = useTranslations("common");

  return (
    <div className="page-shell text-white">
      <AppHeader showNotifications={false} />
      <div className="page-content max-w-5xl py-8 sm:py-16 px-4 sm:px-6">
        <div className="text-center mb-12">
          <BrandLogo size="lg" className="justify-center mb-6" />
          <h1 className="page-title mb-4">{t("aboutTitle")}</h1>
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            {t("aboutIntro")}
          </p>
        </div>

        <div className="about-video-grid mb-14">
          <BrandVideo
            src={SITE_VIDEOS.about}
            title={t("aboutVideoTitle")}
            className="about-video-player rounded-2xl border border-gray-800/80 shadow-2xl shadow-black/40"
            fallback={
              <div className="about-video-player flex items-center justify-center rounded-2xl border border-dashed border-gray-700 bg-navy-800/60">
                <div className="px-6 text-center">
                  <p className="text-gold-400 text-sm font-semibold mb-2">{t("aboutVideoTitle")}</p>
                  <p className="text-gray-500 text-xs leading-relaxed">{t("videoPlaceholderHint")}</p>
                </div>
              </div>
            }
          />
          <div className="flex flex-col justify-center text-start">
            <h2 className="text-2xl font-bold text-gold-400 mb-4">{t("aboutVideoTitle")}</h2>
            <p className="text-gray-400 leading-relaxed mb-6">{t("aboutVideoDesc")}</p>
            <h3 className="text-lg font-semibold text-gray-100 mb-2">{t("aboutMissionTitle")}</h3>
            <p className="text-gray-400 leading-relaxed">{t("aboutMissionDesc")}</p>
          </div>
        </div>

        <h2 className="section-title text-center mb-8">{t("aboutValuesTitle")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {VALUES.map(({ titleKey, descKey }) => (
            <div key={titleKey} className="glass-card p-6 text-center md:text-start">
              <h3 className="text-lg font-bold text-gold-400 mb-2">{t(titleKey)}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{t(descKey)}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link href="/register" className="btn-primary px-8 py-3 inline-flex mr-3 mb-3">
            {tc("register")}
          </Link>
          <Link href="/" className="btn-secondary px-6 py-2.5 rounded-xl text-sm inline-flex mb-3">
            ← {tc("back")}
          </Link>
        </div>
      </div>
    </div>
  );
}
