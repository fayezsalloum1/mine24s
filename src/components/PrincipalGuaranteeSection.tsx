"use client";

import { useTranslations } from "next-intl";
import { PAYOUT_INTERVAL_DAYS } from "@/lib/mining-math";

const STEPS = [
  { num: "01", titleKey: "scienceStep1Title" as const, descKey: "scienceStep1Desc" as const, formulaKey: "scienceStep1Formula" as const },
  { num: "02", titleKey: "scienceStep2Title" as const, descKey: "scienceStep2Desc" as const, formulaKey: "scienceStep2Formula" as const },
  { num: "03", titleKey: "scienceStep3Title" as const, descKey: "scienceStep3Desc" as const, formulaKey: "scienceStep3Formula" as const },
];

export default function PrincipalGuaranteeSection() {
  const t = useTranslations("returns");

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
      <div className="principal-guarantee-banner">
        <div className="text-center mb-10">
          <p className="iconic-badge mb-4 mx-auto w-fit">{t("scienceBadge")}</p>
          <h2 className="section-title mb-3">{t("scienceTitle")}</h2>
          <p className="section-subtitle max-w-2xl mx-auto">{t("scienceSubtitle")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {STEPS.map(({ num, titleKey, descKey, formulaKey }) => (
            <div key={num} className="science-step-card">
              <span className="science-step-num">{num}</span>
              <h3 className="text-lg font-bold text-gray-100 mb-2">{t(titleKey)}</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">{t(descKey)}</p>
              <code className="science-formula">{t(formulaKey, { days: PAYOUT_INTERVAL_DAYS })}</code>
            </div>
          ))}
        </div>

        <div className="science-example glass-card p-6 sm:p-8 max-w-2xl mx-auto text-center">
          <p className="text-xs uppercase tracking-wider text-gray-500 mb-3">{t("exampleLabel")}</p>
          <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-2">{t("exampleLine1")}</p>
          <p className="text-profit font-semibold text-sm sm:text-base mb-2">{t("exampleLine2")}</p>
          <p className="text-gold-400 font-bold text-lg sm:text-xl">{t("exampleLine3")}</p>
          <p className="text-xs text-gray-500 mt-4">{t("examplePoolNote")}</p>
        </div>
      </div>
    </section>
  );
}
