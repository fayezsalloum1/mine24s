type ChatLocale = "en" | "ar";

type FallbackContext = {
  forgotPasswordUrl: string;
  loginUrl: string;
  registerUrl: string;
  plansUrl: string;
  dashboardUrl: string;
  withdrawUrl: string;
  faqUrl: string;
  profileUrl: string;
  contactUrl: string;
  plansSummary: string;
  supportEmail: string;
};

function normalize(text: string) {
  return text.toLowerCase().replace(/[^\w\s\u0600-\u06FF]/g, " ").replace(/\s+/g, " ").trim();
}

function matches(text: string, patterns: RegExp[]) {
  const n = normalize(text);
  return patterns.some((p) => p.test(n));
}

export function getSupportFallback(
  message: string,
  locale: ChatLocale,
  ctx: FallbackContext
): string | null {
  const n = normalize(message);

  if (
    matches(n, [
      /forgot.*password/,
      /forget.*password/,
      /reset.*password/,
      /password.*reset/,
      /lost.*password/,
      /change.*password/,
      /forot.*password/,
      /نسيت.*كلمة/,
      /اعادة.*كلمة/,
      /إعادة.*كلمة/,
      /كلمة.*المرور/,
    ])
  ) {
    return locale === "ar"
      ? `لإعادة تعيين كلمة المرور:

1. افتح: ${ctx.forgotPasswordUrl}
2. أدخل البريد الإلكتروني الذي سجّلت به.
3. تحقق من صندوق الوارد (والبريد المزعج) — ستصلك رسالة "Password Reset".
4. اضغط الرابط في الرسالة واختر كلمة مرور جديدة (8 أحرف على الأقل).
5. سجّل الدخول من: ${ctx.loginUrl}

إذا سجّلت عبر Google، استخدم "Continue with Google" في صفحة الدخول — لا تحتاج إعادة تعيين كلمة المرور.`
      : `To reset your password:

1. Open: ${ctx.forgotPasswordUrl}
2. Enter the email you used to register.
3. Check your inbox and spam for a "Password Reset" email (link expires in 1 hour).
4. Click the link in the email and set a new password (at least 8 characters).
5. Sign in at: ${ctx.loginUrl}

If you signed up with Google, use "Continue with Google" on the login page — you don't need a password reset.`;
  }

  if (matches(n, [/register/, /sign up/, /create account/, /تسجيل/, /حساب جديد/])) {
    return locale === "ar"
      ? `لإنشاء حساب:
1. ${ctx.registerUrl}
2. أدخل البريد وكلمة المرور واقبل الشروط.
3. أدخل رمز التحقق من البريد الإلكتروني.
4. أو سجّل عبر Google من ${ctx.loginUrl}

بعد التسجيل ستجد عنوان إيداع فريد في لوحة التحكم.`
      : `To register:
1. Go to ${ctx.registerUrl}
2. Enter email, password, and accept the terms.
3. Enter the verification code sent to your email.
4. Or use "Continue with Google" on ${ctx.loginUrl}

After signup, your unique deposit address appears on the Dashboard.`;
  }

  if (matches(n, [/deposit/, /إيداع/, /شحن/])) {
    return locale === "ar"
      ? `لإيداع USDT:
1. سجّل الدخول → لوحة التحكم → زر Deposit.
2. اختر الشبكة: ERC20 أو BEP20 أو TRC20 أو SOL (Solana USDT).
3. انسخ عنوانك الفريد وأرسل USDT على نفس الشبكة بالضبط.
4. ستصلك إشعار عند الاكتشاف ثم عند إضافة الرصيد.

تحذير: الشبكة الخاطئة قد تفقد الأموال.`
      : `To deposit USDT:
1. Log in → Dashboard → Deposit button.
2. Choose network: ERC20, BEP20, TRC20, or SOL (Solana USDT).
3. Copy YOUR unique address and send USDT on that exact network.
4. You'll get a notification when detected, then when your balance is credited.

Warning: wrong network can lose funds.`;
  }

  if (matches(n, [/withdraw/, /سحب/, /سحبت/])) {
    return locale === "ar"
      ? `للسحب:
1. فقط أرباح التعدين المُضافة (credited profit) قابلة للسحب — ليس رصيد الإيداع.
2. ${ctx.withdrawUrl} — أدخل المبلغ والشبكة وعنوان محفظتك.
3. يراجع المسؤول الطلب ثم يُرسل USDT تلقائياً لعنوانك.
4. قد تحتاج إحالة مستخدم واحد اشترى خطة. فترة انتظار 7 أيام بين السحوبات المعتمدة.`
      : `To withdraw:
1. Only credited mining profit is withdrawable — not your deposit balance.
2. Go to ${ctx.withdrawUrl} — enter amount, network, and your wallet address.
3. Admin approves → USDT is sent automatically to your address.
4. You may need 1 referred user who bought a plan. 7-day cooldown between approved withdrawals.`;
  }

  if (matches(n, [/plan/, /pool/, /shared/, /solo/, /خطة/, /خطط/, /باقة/])) {
    return locale === "ar"
      ? `الخطط الحالية:
${ctx.plansSummary}

• Solo: تبدأ فور الشراء.
• Shared pool: تنتظر حتى اكتمال 100% ثم تبدأ للجميع.
• الربح = السعر × النسبة اليومية × عدد الأيام + استرداد 100% من رأس المال في النهاية.
• يُضاف الربح كل 10 أيام.

تصفح واشترِ: ${ctx.plansUrl}
أسئلة شائعة: ${ctx.faqUrl}`
      : `Current plans:
${ctx.plansSummary}

• Solo: starts immediately after purchase.
• Shared pool: waits until 100% filled, then starts for everyone.
• Profit = price × daily % × duration days + 100% principal returned at the end.
• Profit is credited every 10 days.

Browse & buy: ${ctx.plansUrl}
FAQ: ${ctx.faqUrl}`;
  }

  if (matches(n, [/referral/, /refer/, /invite/, /إحالة/, /دعوة/])) {
    return locale === "ar"
      ? `برنامج الإحالة:
• رابط الإحالة في لوحة التحكم أو الملف الشخصي: ${ctx.profileUrl}
• تحصل على 10% عمولة عندما يشتري المُحال خطة — تُضاف لرصيدك فوراً.`
      : `Referral program:
• Your referral link is on the Dashboard or Profile: ${ctx.profileUrl}
• You earn 10% commission when someone you referred buys a plan — credited instantly.`;
  }

  if (matches(n, [/login/, /sign in/, /دخول/, /تسجيل الدخول/])) {
    return locale === "ar"
      ? `تسجيل الدخول:
• بريد وكلمة مرور: ${ctx.loginUrl}
• Google: نفس الصفحة → "Continue with Google"
• نسيت كلمة المرور: ${ctx.forgotPasswordUrl}`
      : `To log in:
• Email & password: ${ctx.loginUrl}
• Google: same page → "Continue with Google"
• Forgot password: ${ctx.forgotPasswordUrl}`;
  }

  if (matches(n, [/support/, /help/, /contact/, /human/, /مساعدة/, /دعم/, /تواصل/])) {
    const emailLine = ctx.supportEmail
      ? locale === "ar"
        ? `البريد: ${ctx.supportEmail}`
        : `Email: ${ctx.supportEmail}`
      : "";
    return locale === "ar"
      ? `للدعم البشري:
• صفحة التواصل: ${ctx.contactUrl}
• الأسئلة الشائعة: ${ctx.faqUrl}
${emailLine}
لا أستطيع رؤية رصيدك أو طلباتك — المسؤول يراجع السحوبات والإيداعات اليدوية.`
      : `For human support:
• Contact page: ${ctx.contactUrl}
• FAQ: ${ctx.faqUrl}
${emailLine}
I cannot see your balance or requests — admin reviews withdrawals and manual deposit cases.`;
  }

  return null;
}

export function getGenericFallback(locale: ChatLocale, ctx: FallbackContext): string {
  return locale === "ar"
    ? `عذراً، المساعد الذكي غير متاح مؤقتاً. جرّب:
• إعادة كلمة المرور: ${ctx.forgotPasswordUrl}
• الخطط: ${ctx.plansUrl}
• الأسئلة الشائعة: ${ctx.faqUrl}
${ctx.supportEmail ? `• البريد: ${ctx.supportEmail}` : ""}`
    : `Sorry, the AI assistant is temporarily unavailable. Try:
• Password reset: ${ctx.forgotPasswordUrl}
• Plans: ${ctx.plansUrl}
• FAQ: ${ctx.faqUrl}
${ctx.supportEmail ? `• Email: ${ctx.supportEmail}` : ""}`;
}
