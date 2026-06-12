"use client";

import { useTranslations } from "next-intl";

const BADGES = [
  { icon: "🔒", key: "trustSecure" as const },
  { icon: "⚡", key: "trustUptime" as const },
  { icon: "💎", key: "trustTransparent" as const },
  { icon: "🌍", key: "trustGlobal" as const },
];

export default function TrustBadges() {
  const t = useTranslations("landing");

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {BADGES.map(({ icon, key }) => (
          <div key={key} className="glass-card p-5 text-center transition-all duration-300 hover:border-gold-500/30">
            <span className="text-2xl mb-2 block" aria-hidden>{icon}</span>
            <p className="text-sm font-semibold text-gray-200">{t(key)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
