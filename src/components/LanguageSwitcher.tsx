"use client";

import { useLocaleContext } from "./LocaleProvider";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocaleContext();

  return (
    <div className="flex gap-0.5 bg-slate-800/60 border border-slate-700/50 rounded-lg p-0.5">
      <button
        onClick={() => setLocale("en")}
        className={`px-2.5 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-semibold transition-all ${
          locale === "en"
            ? "bg-gradient-to-r from-amber-500 to-amber-400 text-black shadow-sm"
            : "text-slate-400 hover:text-white"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLocale("ar")}
        className={`px-2.5 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-semibold transition-all ${
          locale === "ar"
            ? "bg-gradient-to-r from-amber-500 to-amber-400 text-black shadow-sm"
            : "text-slate-400 hover:text-white"
        }`}
      >
        عربي
      </button>
    </div>
  );
}
