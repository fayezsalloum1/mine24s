"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface ReferralLinkActionsProps {
  link: string;
  className?: string;
}

export default function ReferralLinkActions({ link, className = "" }: ReferralLinkActionsProps) {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState("");

  const copyLink = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = async () => {
    setShareError("");
    if (navigator.share) {
      try {
        await navigator.share({
          title: t("referralShareTitle"),
          text: t("referralShareText"),
          url: link,
        });
      } catch {
        /* user cancelled */
      }
    } else {
      await copyLink();
      setShareError(t("referralShareFallback"));
      setTimeout(() => setShareError(""), 3000);
    }
  };

  return (
    <div className={className}>
      <p className="text-slate-400 text-sm mb-2">{t("referralLink")}</p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          readOnly
          value={link}
          className="flex-1 p-2.5 rounded-xl bg-slate-900/70 border border-slate-700/60 text-xs sm:text-sm font-mono text-cyan-400"
        />
        <div className="flex gap-2">
          <button
            onClick={copyLink}
            className="flex-1 sm:flex-none px-4 py-2.5 btn-primary rounded-xl text-sm whitespace-nowrap"
          >
            {copied ? tc("copied") : tc("copy")}
          </button>
          <button
            onClick={shareLink}
            className="flex-1 sm:flex-none px-4 py-2.5 btn-outline rounded-xl text-sm whitespace-nowrap"
          >
            {tc("share")}
          </button>
        </div>
      </div>
      {shareError && <p className="text-emerald-400 text-xs mt-2">{shareError}</p>}
      <p className="text-slate-500 text-xs mt-2">{t("referralHint")}</p>
    </div>
  );
}
