"use client";

import ReferralLinkActions from "@/components/ReferralLinkActions";
import { useTranslations } from "next-intl";

interface ReferralShowcaseProps {
  referralLink: string;
  totalReferrals: number;
  totalReferralEarned: number;
}

export default function ReferralShowcase({
  referralLink,
  totalReferrals,
  totalReferralEarned,
}: ReferralShowcaseProps) {
  const t = useTranslations("dashboard");

  return (
    <div className="iconic-banner mb-8 p-5 sm:p-7 text-start">
      <div className="iconic-banner-glow -top-16 -right-16 w-44 h-44 bg-amber-500/12" />
      <div className="iconic-banner-glow -bottom-12 -left-12 w-36 h-36 bg-emerald-500/10" />

      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1">
            <div className="iconic-badge mb-4 w-fit">{t("referralProgramBadge")}</div>
            <h2 className="text-xl sm:text-3xl font-black text-gradient-gold mb-3 tracking-tight">
              {t("referralHeadline")}
            </h2>
            <p className="text-slate-300/90 text-sm sm:text-base mb-5 max-w-xl leading-relaxed">
              {t("referralHeadlineDesc")}
            </p>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-md">
              <div className="rounded-xl bg-black/30 border border-emerald-500/25 px-4 py-3.5 backdrop-blur-sm">
                <p className="iconic-stat-label">{t("totalEarned")}</p>
                <p className="text-2xl sm:text-3xl font-black text-emerald-400 tabular-nums">
                  ${totalReferralEarned.toFixed(2)}
                </p>
              </div>
              <div className="rounded-xl bg-black/30 border border-amber-500/25 px-4 py-3.5 backdrop-blur-sm">
                <p className="iconic-stat-label">{t("totalReferrals")}</p>
                <p className="text-2xl sm:text-3xl font-black text-amber-400 tabular-nums">
                  {totalReferrals}
                </p>
              </div>
            </div>

            <p className="mt-5 text-amber-300 text-sm font-bold tracking-wide">
              {t("referralCommissionRate")}
            </p>
          </div>

          <div className="lg:w-[min(100%,420px)] lg:shrink-0 rounded-xl bg-black/35 border border-white/10 p-4 backdrop-blur-sm">
            <ReferralLinkActions link={referralLink} />
          </div>
        </div>
      </div>
    </div>
  );
}
