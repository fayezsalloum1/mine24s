"use client";

import { useTranslations } from "next-intl";
import { MARKETING_CLIPS } from "@/lib/site-videos";

export default function MarketingClipsSection() {
  const t = useTranslations("landing");

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
      <div className="text-center mb-10">
        <p className="iconic-badge mb-4 mx-auto w-fit">{t("clipsBadge")}</p>
        <h2 className="section-title mb-3">{t("clipsTitle")}</h2>
        <p className="section-subtitle">{t("clipsDesc")}</p>
      </div>

      <div className="marketing-clips-grid">
        {MARKETING_CLIPS.map((clip) => (
          <article key={clip.src} className="marketing-clip-card glass-card overflow-hidden">
            <div className="marketing-clip-video-wrap">
              <video
                className="h-full w-full object-cover"
                src={clip.src}
                controls
                playsInline
                preload="auto"
                aria-label={t(clip.titleKey)}
              />
            </div>
            <div className="p-5 sm:p-6">
              <h3 className="text-lg font-bold text-gold-400 mb-2">{t(clip.titleKey)}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{t(clip.descKey)}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
