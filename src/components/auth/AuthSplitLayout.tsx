"use client";

import BrandLogo from "@/components/BrandLogo";
import { useTranslations } from "next-intl";
import { PLATFORM_DISPLAY_DEFAULTS, formatStatNumber, formatLiquidationUsd } from "@/lib/platform-display-stats";

export default function AuthSplitLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("auth");

  return (
    <div className="min-h-[calc(100dvh-4rem)] grid lg:grid-cols-2">
      <div className="flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <BrandLogo size="lg" />
          </div>
          {children}
        </div>
      </div>

      <div className="hidden lg:flex flex-col justify-center px-12 py-16 bg-navy-800/60 border-s border-gray-800/80 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-20" />
        <div className="relative z-10 max-w-md">
          <p className="text-gold-400 text-sm font-semibold uppercase tracking-wider mb-4">
            {t("authPanelBadge")}
          </p>
          <h2 className="text-3xl font-bold text-gray-50 mb-4 leading-tight">
            {t("authPanelTitle")}
          </h2>
          <p className="text-gray-400 mb-10 leading-relaxed">{t("authPanelDesc")}</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{t("authStatUsers")}</p>
              <p className="text-2xl font-bold text-gold-400 glow-gold">
                {formatStatNumber(PLATFORM_DISPLAY_DEFAULTS.totalUsers)}+
              </p>
            </div>
            <div className="glass-card p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{t("authStatPaid")}</p>
              <p className="text-xl font-bold text-profit glow-profit">
                {formatLiquidationUsd(PLATFORM_DISPLAY_DEFAULTS.totalLiquidation)}
              </p>
            </div>
            <div className="glass-card p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{t("authStatUptime")}</p>
              <p className="text-2xl font-bold text-gray-100">99.9%</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{t("authStatSupport")}</p>
              <p className="text-2xl font-bold text-gray-100">24/7</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
