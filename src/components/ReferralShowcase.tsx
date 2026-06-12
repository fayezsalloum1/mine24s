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
    <div className="referral-banner mb-8 text-start">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div className="flex-1">
          <p className="iconic-badge mb-3 w-fit">{t("referralProgramBadge")}</p>
          <h2 className="text-xl sm:text-2xl font-bold text-gold-400 mb-2">{t("referralHeadline")}</h2>
          <p className="text-gray-400 text-sm sm:text-base mb-4 max-w-xl">{t("referralHeadlineDesc")}</p>

          <div className="grid grid-cols-2 gap-3 max-w-md">
            <div className="glass-card p-4">
              <p className="iconic-stat-label">{t("totalEarned")}</p>
              <p className="text-2xl font-bold text-profit glow-profit">${totalReferralEarned.toFixed(2)}</p>
            </div>
            <div className="glass-card p-4">
              <p className="iconic-stat-label">{t("totalReferrals")}</p>
              <p className="text-2xl font-bold text-gold-400">{totalReferrals}</p>
            </div>
          </div>
          <p className="mt-4 text-gold-400 text-sm font-semibold">{t("referralCommissionRate")}</p>
        </div>
        <div className="lg:w-[min(100%,400px)] glass-card p-4">
          <ReferralLinkActions link={referralLink} />
        </div>
      </div>
    </div>
  );
}
