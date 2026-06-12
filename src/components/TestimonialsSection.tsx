"use client";

import { useTranslations } from "next-intl";

const TESTIMONIALS = [
  { nameKey: "testimonial1Name" as const, roleKey: "testimonial1Role" as const, quoteKey: "testimonial1Quote" as const, stars: 5 },
  { nameKey: "testimonial2Name" as const, roleKey: "testimonial2Role" as const, quoteKey: "testimonial2Quote" as const, stars: 5 },
  { nameKey: "testimonial3Name" as const, roleKey: "testimonial3Role" as const, quoteKey: "testimonial3Quote" as const, stars: 5 },
];

export default function TestimonialsSection() {
  const t = useTranslations("landing");

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
      <h2 className="section-title mb-3">{t("testimonialsTitle")}</h2>
      <p className="section-subtitle">{t("testimonialsSubtitle")}</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
        {TESTIMONIALS.map(({ nameKey, roleKey, quoteKey, stars }) => (
          <div key={nameKey} className="glass-card p-6 flex flex-col h-full">
            <div className="flex gap-0.5 mb-4 text-gold-400" aria-label={`${stars} stars`}>
              {Array.from({ length: stars }).map((_, i) => (
                <span key={i}>★</span>
              ))}
            </div>
            <p className="text-gray-300 text-sm leading-relaxed flex-1 mb-5">&ldquo;{t(quoteKey)}&rdquo;</p>
            <div>
              <p className="font-semibold text-gray-100">{t(nameKey)}</p>
              <p className="text-xs text-gray-500">{t(roleKey)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
