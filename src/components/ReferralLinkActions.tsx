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
      <p className="text-gray-400 text-sm mb-2">{t("referralLink")}</p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          readOnly
          value={link}
          className="flex-1 p-2 rounded bg-gray-700 text-sm font-mono text-blue-400"
        />
        <div className="flex gap-2">
          <button
            onClick={copyLink}
            className="px-4 py-2 bg-yellow-500 text-black rounded font-bold text-sm hover:bg-yellow-400 whitespace-nowrap"
          >
            {copied ? tc("copied") : tc("copy")}
          </button>
          <button
            onClick={shareLink}
            className="px-4 py-2 bg-gray-700 text-white rounded font-bold text-sm hover:bg-gray-600 whitespace-nowrap"
          >
            {tc("share")}
          </button>
        </div>
      </div>
      {shareError && <p className="text-green-400 text-xs mt-2">{shareError}</p>}
      <p className="text-gray-500 text-xs mt-2">{t("referralHint")}</p>
    </div>
  );
}
