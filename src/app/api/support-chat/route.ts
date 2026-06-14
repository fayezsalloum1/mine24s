import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getGenericFallback, getSupportFallback } from "@/lib/support-fallbacks";

export const dynamic = "force-dynamic";

type ChatLocale = "en" | "ar";

const GEMINI_MODELS = (
  process.env.GEMINI_MODEL ||
  "gemini-2.0-flash,gemini-1.5-flash,gemini-2.5-flash"
)
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);

function siteBase() {
  return (process.env.NEXTAUTH_URL || "https://mine24s.vercel.app").replace(/\/$/, "");
}

function link(path: string) {
  return `${siteBase()}${path}`;
}

function buildFallbackContext(plansSummary: string) {
  return {
    forgotPasswordUrl: link("/forgot-password"),
    loginUrl: link("/login"),
    registerUrl: link("/register"),
    plansUrl: link("/plans"),
    dashboardUrl: link("/dashboard"),
    withdrawUrl: link("/withdraw"),
    faqUrl: link("/faq"),
    profileUrl: link("/profile"),
    contactUrl: link("/contact"),
    plansSummary,
    supportEmail: process.env.SUPPORT_EMAIL?.trim() || process.env.SMTP_FROM?.trim() || "",
  };
}

async function getActivePlansSummary() {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true, acceptingSubscriptions: true },
      orderBy: [{ planType: "asc" }, { price: "asc" }],
      take: 25,
    });

    if (plans.length === 0) {
      return "No active plans right now — check the Plans page.";
    }

    return plans
      .map((p) => {
        const dailyProfit = (p.price * p.dailyReturnPercent) / 100;
        const totalProfit = dailyProfit * p.durationDays;
        const type = p.planType === "POOLED" ? "Shared" : "Solo";
        return `• ${p.name} (${type}): $${p.price}, ${p.dailyReturnPercent}%/day, ${p.durationDays}d → ~$${totalProfit.toFixed(0)} profit + $${p.price} principal back`;
      })
      .join("\n");
  } catch {
    return "See the Plans page for current offers.";
  }
}

function buildSystemPrompt(locale: ChatLocale, plansSummary: string) {
  const ctx = buildFallbackContext(plansSummary);
  const languageRule =
    locale === "ar"
      ? "Reply in Modern Standard Arabic. Keep URLs unchanged."
      : "Reply in English unless user asks to switch.";

  return `You are Simple Mining support assistant. ${languageRule}
Give numbered steps and full URLs. Password reset: ${ctx.forgotPasswordUrl}
Plans:\n${plansSummary}
Never invent prices. No investment advice. No passwords/keys.`;
}

async function callGemini(
  apiKey: string,
  systemPrompt: string,
  contents: Array<{ role: string; parts: Array<{ text: string }> }>
) {
  let lastError = "";

  for (const model of GEMINI_MODELS) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
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

    if (res.ok) {
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (text) return { ok: true as const, text, model };
    }

    lastError = await res.text();
    console.warn(`[support-chat] ${model} failed:`, res.status, lastError.slice(0, 300));
  }

  return { ok: false as const, error: lastError };
}

export async function POST(req: Request) {
  try {
    const { message, history, locale } = await req.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    const chatLocale: ChatLocale = locale === "ar" ? "ar" : "en";
    const plansSummary = await getActivePlansSummary();
    const ctx = buildFallbackContext(plansSummary);

    const fallback = getSupportFallback(message, chatLocale, ctx);
    if (fallback) {
      return NextResponse.json({ reply: fallback, source: "guide" });
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json({
        reply: getGenericFallback(chatLocale, ctx),
        source: "guide",
      });
    }

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

    const gemini = await callGemini(apiKey, systemPrompt, contents);
    if (gemini.ok) {
      return NextResponse.json({ reply: gemini.text, source: "ai" });
    }

    console.error("[support-chat] all models failed:", gemini.error.slice(0, 500));
    return NextResponse.json({
      reply: getGenericFallback(chatLocale, ctx),
      source: "guide",
    });
  } catch (err) {
    console.error("[support-chat]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
