import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type ChatLocale = "en" | "ar";

function buildSystemPrompt(locale: ChatLocale) {
  const languageRule =
    locale === "ar"
      ? "Always reply in Modern Standard Arabic. Keep crypto terms (USDT, ERC20, etc.) in English when clearer."
      : "Always reply in English unless the user explicitly asks to switch language.";

  return `You are the support assistant for "Simple Mining", a USDT cloud mining platform.

${languageRule}

YOUR ROLE:
- Answer questions about how the platform works and guide users step-by-step.
- Help with: registration, email/Google login, deposits, buying plans, withdrawals, referrals, solo vs shared pools.

STRICT RULES — never break these:
- Do NOT give financial or investment advice.
- Do NOT promise or guarantee profits. Returns depend on plan terms (daily % × duration); actual credited amounts follow the platform schedule.
- If you do not know something, or the issue is account-specific (balance, stuck deposit/withdrawal, frozen account), tell the user to contact human support via the Contact page — never invent answers.
- Keep answers short (2–5 sentences), clear, and step-by-step.
- Never ask for passwords, seed phrases, or private keys.

PLATFORM FACTS:
- Currency: USDT only.
- Deposit networks: ERC20 (Ethereum), BEP20 (BNB Chain), TRC20 (TRON), SOL (Solana USDT). Each user gets a unique deposit address.
- Deposits are scanned automatically; users receive a notification when a deposit is detected, then when balance is credited.
- Plans: Solo plans start immediately. Shared (pooled) plans fill until 100%, then start together; profit is split by contribution share.
- Mining profit accrues on the dashboard and is credited every 10 days. When a plan ends, remaining profit plus 100% of principal returns to balance.
- Only credited profit is withdrawable (not uncredited live accrual). Deposit/principal balance is used to buy plans, not direct withdrawal.
- Withdrawals: user submits amount + network + wallet address on the Withdraw page. Admin approves; then USDT is sent automatically to the user's address on the chosen network.
- Referrals: 10% commission when a referred user buys a plan. A referral may be required before withdrawals (platform setting).
- Withdrawal cooldown: 7 days between approved withdrawals.
- Admin panel handles deposit/withdrawal review for edge cases; most deposits are automatic.`;
}

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

export async function POST(req: Request) {
  try {
    const { message, history, locale } = await req.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    const chatLocale: ChatLocale = locale === "ar" ? "ar" : "en";

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        { error: chatLocale === "ar" ? "الدردشة غير مفعّلة بعد." : "Support chat is not configured yet." },
        { status: 503 }
      );
    }

    const contents = [
      ...(Array.isArray(history) ? history : []).map(
        (h: { role: string; text: string }) => ({
          role: h.role === "assistant" ? "model" : "user",
          parts: [{ text: String(h.text).slice(0, 2000) }],
        })
      ),
      { role: "user", parts: [{ text: message.slice(0, 2000) }] },
    ];

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: buildSystemPrompt(chatLocale) }] },
          contents,
          generationConfig: { temperature: 0.3, maxOutputTokens: 500 },
        }),
      }
    );

    if (!res.ok) {
      const body = await res.text();
      console.error("[support-chat] gemini error:", res.status, body);
      return NextResponse.json(
        {
          error:
            chatLocale === "ar"
              ? "الدعم مشغول حالياً. حاول مرة أخرى."
              : "Support is busy right now. Please try again.",
        },
        { status: 502 }
      );
    }

    const data = await res.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      (chatLocale === "ar"
        ? "عذراً، لم أتمكن من الإجابة. تواصل مع فريق الدعم."
        : "Sorry, I couldn't answer that. Please contact human support.");

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("[support-chat]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
