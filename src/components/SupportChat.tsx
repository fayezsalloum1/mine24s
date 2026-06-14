"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useLocaleContext } from "@/components/LocaleProvider";

type ChatLocale = "en" | "ar";
type Msg = { role: "user" | "assistant"; text: string };

export default function SupportChat() {
  const t = useTranslations("supportChat");
  const { locale: siteLocale } = useLocaleContext();
  const [open, setOpen] = useState(false);
  const [chatLocale, setChatLocale] = useState<ChatLocale | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  function startChat(locale: ChatLocale) {
    setChatLocale(locale);
    setMessages([{ role: "assistant", text: t(`welcome.${locale}`) }]);
  }

  function resetChat() {
    setChatLocale(null);
    setMessages([]);
    setInput("");
  }

  async function send() {
    const text = input.trim();
    if (!text || busy || !chatLocale) return;
    setInput("");
    const newMsgs: Msg[] = [...messages, { role: "user", text }];
    setMessages(newMsgs);
    setBusy(true);
    try {
      const res = await fetch("/api/support-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          locale: chatLocale,
          history: newMsgs.slice(-8).map((m) => ({ role: m.role, text: m.text })),
        }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: data.reply || data.error || t("errorFallback"),
        },
      ]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: t("connectionError") }]);
    } finally {
      setBusy(false);
    }
  }

  const recommended: ChatLocale = siteLocale === "ar" ? "ar" : "en";

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-[100] h-14 w-14 rounded-full bg-amber-500 text-black font-bold shadow-lg hover:bg-amber-400 flex items-center justify-center text-2xl"
        aria-label={t("title")}
      >
        {open ? "×" : "💬"}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-[100] w-80 max-w-[90vw] h-96 rounded-xl border border-gray-700 bg-gray-900 shadow-2xl flex flex-col overflow-hidden">
          <div className="bg-gray-800 px-4 py-3 text-amber-400 font-semibold text-sm border-b border-gray-700 flex items-center justify-between gap-2">
            <span>{t("title")}</span>
            {chatLocale && (
              <button
                type="button"
                onClick={resetChat}
                className="text-xs text-gray-400 hover:text-white"
              >
                {t("changeLanguage")}
              </button>
            )}
          </div>

          {!chatLocale ? (
            <div className="flex-1 flex flex-col items-center justify-center p-5 text-center gap-4">
              <p className="text-gray-200 text-sm font-medium">{t("chooseLanguage")}</p>
              <p className="text-gray-500 text-xs">{t("languageHint")}</p>
              <div className="flex flex-col w-full gap-2">
                <button
                  type="button"
                  onClick={() => startChat("en")}
                  className={`rounded-lg px-4 py-3 text-sm font-medium border transition-colors ${
                    recommended === "en"
                      ? "bg-amber-500 text-black border-amber-400"
                      : "bg-gray-800 text-gray-100 border-gray-600 hover:border-gray-500"
                  }`}
                >
                  {t("english")}
                  {recommended === "en" && (
                    <span className="block text-xs opacity-80 mt-0.5">{t("recommended")}</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => startChat("ar")}
                  className={`rounded-lg px-4 py-3 text-sm font-medium border transition-colors ${
                    recommended === "ar"
                      ? "bg-amber-500 text-black border-amber-400"
                      : "bg-gray-800 text-gray-100 border-gray-600 hover:border-gray-500"
                  }`}
                >
                  {t("arabic")}
                  {recommended === "ar" && (
                    <span className="block text-xs opacity-80 mt-0.5">{t("recommended")}</span>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`text-sm rounded-lg px-3 py-2 max-w-[85%] whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-amber-500 text-black ml-auto"
                        : "bg-gray-800 text-gray-100"
                    }`}
                  >
                    {m.text}
                  </div>
                ))}
                {busy && <div className="text-xs text-gray-500">{t("typing")}</div>}
                <div ref={endRef} />
              </div>
              <div className="p-2 border-t border-gray-700 flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder={t("placeholder")}
                  className="flex-1 rounded-lg bg-gray-800 border border-gray-600 px-3 py-2 text-white text-sm"
                />
                <button
                  onClick={send}
                  disabled={busy}
                  className="rounded-lg bg-amber-500 text-black px-3 font-medium disabled:opacity-50"
                >
                  {t("send")}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
