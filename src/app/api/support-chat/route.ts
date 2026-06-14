import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type ChatLocale = "en" | "ar";

function siteBase() {
  return (process.env.NEXTAUTH_URL || "https://mine24s.vercel.app").replace(/\/$/, "");
}

function link(path: string) {
  return `${siteBase()}${path}`;
}

async function getActivePlansSummary() {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true, acceptingSubscriptions: true },
      orderBy: [{ planType: "asc" }, { price: "asc" }],
      take: 25,
    });

    if (plans.length === 0) {
      return "No active plans listed right now. Tell the user to check the Plans page — new plans are added by admin.";
    }

    return plans
      .map((p) => {
        const dailyProfit = (p.price * p.dailyReturnPercent) / 100;
        const totalProfit = dailyProfit * p.durationDays;
        const type = p.planType === "POOLED" ? "Shared pool" : "Solo";
        const poolNote =
          p.planType === "POOLED"
            ? ` Pool target $${p.targetPoolAmount ?? p.price}; starts when 100% filled.`
            : " Starts immediately after purchase.";
        return `• ${p.name} (${type}): price $${p.price} USDT, ${p.dailyReturnPercent}%/day, ${p.durationDays} days → ~$${totalProfit.toFixed(2)} total mining profit + 100% principal ($${p.price}) returned at end.${poolNote}`;
      })
      .join("\n");
  } catch {
    return "Plans list unavailable — direct user to the Plans page.";
  }
}

function buildSystemPrompt(locale: ChatLocale, plansSummary: string) {
  const base = siteBase();
  const supportEmail = process.env.SUPPORT_EMAIL?.trim() || process.env.SMTP_FROM?.trim() || "";

  const languageRule =
    locale === "ar"
      ? "Always reply in Modern Standard Arabic. Keep URLs, network codes (USDT, ERC20), and dollar amounts as-is."
      : "Always reply in English unless the user explicitly asks to switch language.";

  const supportLine = supportEmail
    ? `Human support email: ${supportEmail} (for account issues the bot cannot fix).`
    : "Human support: Contact page in the site menu, or wait for admin notification reply.";

  return `You are the friendly support assistant for "Simple Mining" — a USDT cloud mining platform.
Site URL: ${base}

${languageRule}

HOW TO ANSWER:
- Give clear numbered step-by-step instructions when the user asks how to do something.
- Always include the exact page link (full URL) when relevant — users need clickable paths.
- For plans questions: use the LIVE PLANS list below and explain solo vs shared clearly with a short example.
- For password/login issues: always include the forgot-password link and explain the email reset flow.
- Use 4–8 sentences or a short numbered list — be helpful, not overly brief.
- End with "Anything else?" only when the answer was long.

STRICT RULES:
- Do NOT give investment advice or guarantee profits.
- Do NOT invent plan names, prices, or balances — use LIVE PLANS only.
- Do NOT ask for passwords, seed phrases, or private keys.
- For account-specific issues (exact balance, stuck withdrawal, frozen account): explain you cannot see their account, then give ${supportLine} and link to ${link("/contact")}.

KEY PAGE LINKS (always use full URLs):
- Home: ${link("/")}
- Register: ${link("/register")}
- Login: ${link("/login")}
- Forgot password / reset request: ${link("/forgot-password")}  ← SEND USERS HERE for password reset
- FAQ: ${link("/faq")}
- Plans (browse & buy): ${link("/plans")}
- Dashboard: ${link("/dashboard")}
- Withdraw: ${link("/withdraw")}
- Profile & 2FA: ${link("/profile")}
- Contact support: ${link("/contact")}

PASSWORD RESET (when user forgot password, locked out, or asks for reset link):
1. Go to ${link("/forgot-password")}
2. Enter the email used at registration.
3. Check inbox (and spam) for "Password Reset" email — link expires in 1 hour.
4. Click the link in the email → opens ${link("/reset-password")} → set a new password (min 8 characters).
5. Return to ${link("/login")} and sign in.
Note: Google sign-in users should use "Continue with Google" on login — no password reset needed unless they also set an email password.

REGISTRATION & LOGIN:
- Email register: ${link("/register")} → verify email with code sent to inbox → login.
- Google: ${link("/login")} → "Continue with Google".
- After login, dashboard shows balance, active plans, deposit button.

DEPOSITS (USDT only):
1. Login → Dashboard → Deposit button.
2. Choose network: ERC20 (Ethereum), BEP20 (BNB Chain), TRC20 (TRON), or SOL (Solana USDT).
3. Copy YOUR unique address and send USDT on that exact network.
4. You get a notification when detected, then when balance is credited (usually within minutes).
Wrong network = funds may be lost — always match network.

BUYING A PLAN:
1. Deposit enough USDT first.
2. Go to ${link("/plans")} — each card shows price, daily %, duration, and total profit math.
3. Solo plan: starts mining immediately. Shared pool: your funds wait until pool is 100% full, then everyone starts together.
4. Profit formula: daily profit = plan price × daily %; total profit ≈ daily profit × duration days.
5. Profit credited every 10 days on dashboard. When plan ends: remaining profit + 100% of principal returned to balance.

LIVE PLANS (current — cite these when asked about plans):
${plansSummary}

WITHDRAWALS:
1. Only credited mining profit is withdrawable (not uncredited live profit, not raw deposit balance).
2. Go to ${link("/withdraw")} → enter amount, network (ERC20/BEP20/TRC20), and your external wallet address.
3. Admin approves → USDT sent automatically to your address.
4. May need at least 1 referred user who bought a plan (platform setting). 7-day cooldown between approved withdrawals.

REFERRALS:
- Find your referral link on Dashboard or Profile.
- You earn 10% commission when someone you referred buys any plan — credited to your balance.

2FA:
- Enable in ${link("/profile")} with an authenticator app.`;
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

    const plansSummary = await getActivePlansSummary();
    const systemPrompt = buildSystemPrompt(chatLocale, plansSummary);

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
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: { temperature: 0.35, maxOutputTokens: 900 },
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
