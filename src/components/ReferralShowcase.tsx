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
    <div className="relative mb-8 overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-950/40 via-slate-900/90 to-emerald-950/30 p-5 sm:p-6 shadow-[0_0_40px_-12px_rgba(245,158,11,0.35)]">
      <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-semibold mb-3">
              {t("referralProgramBadge")}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gradient-gold mb-2">
              {t("referralHeadline")}
            </h2>
            <p className="text-slate-300 text-sm sm:text-base mb-4 max-w-xl leading-relaxed">
              {t("referralHeadlineDesc")}
            </p>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-md">
              <div className="rounded-xl bg-slate-950/50 border border-emerald-500/25 px-4 py-3">
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">{t("totalEarned")}</p>
                <p className="text-2xl sm:text-3xl font-bold text-emerald-400 tabular-nums">
                  ${totalReferralEarned.toFixed(2)}
                </p>
              </div>
              <div className="rounded-xl bg-slate-950/50 border border-amber-500/25 px-4 py-3">
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">{t("totalReferrals")}</p>
                <p className="text-2xl sm:text-3xl font-bold text-amber-400 tabular-nums">
                  {totalReferrals}
                </p>
              </div>
            </div>

            <p className="mt-4 text-amber-400/90 text-sm font-semibold">
              {t("referralCommissionRate")}
            </p>
          </div>

          <div className="lg:w-[min(100%,420px)] lg:shrink-0 rounded-xl bg-slate-950/60 border border-slate-700/50 p-4">
            <ReferralLinkActions link={referralLink} />
          </div>
        </div>
      </div>
    </div>
  );
}
