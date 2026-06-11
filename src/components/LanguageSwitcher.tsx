"use client";

import { useLocaleContext } from "./LocaleProvider";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocaleContext();

  return (
    <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
      <button
        onClick={() => setLocale("en")}
        className={`px-3 py-1 rounded text-sm font-medium transition ${
          locale === "en"
            ? "bg-yellow-500 text-black"
            : "text-gray-400 hover:text-white"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLocale("ar")}
        className={`px-3 py-1 rounded text-sm font-medium transition ${
          locale === "ar"
            ? "bg-yellow-500 text-black"
            : "text-gray-400 hover:text-white"
        }`}
      >
        عربي
      </button>
    </div>
  );
}
