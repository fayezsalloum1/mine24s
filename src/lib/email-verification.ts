import { prisma } from "@/lib/prisma";
import { sendEmail, emailVerificationHtml, welcomeEmailHtml, isEmailConfigured } from "@/lib/email";
import { generateSixDigitCode, EMAIL_VERIFICATION_TTL_MS } from "@/lib/auth-codes";
import { resetVerificationAttempts } from "@/lib/auth-rate-limit";
import { BRAND_NAME } from "@/lib/constants";

function shouldAutoVerifyOnEmailFail(error?: string): boolean {
  if (process.env.AUTO_VERIFY_ON_EMAIL_FAIL !== "true") return false;
  if (!error) return true;
  // Misconfigured sender — don't auto-verify; fix SMTP_FROM in env instead.
  if (error.includes("SMTP_FROM")) return false;
  return true;
}

export async function autoVerifyUser(userId: string, email: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      emailVerified: true,
      emailVerificationCode: null,
      emailVerificationExpiry: null,
      emailVerificationAttempts: 0,
      emailVerificationLockedUntil: null,
    },
  });
  await resetVerificationAttempts(userId);
  await sendWelcomeAfterVerification(userId, email);
}

export async function sendVerificationEmail(userId: string, email: string) {
  if (process.env.SKIP_EMAIL_VERIFICATION === "true") {
    console.warn("[email-verification] SKIP_EMAIL_VERIFICATION=true — auto-verifying user");
    await autoVerifyUser(userId, email);
    return { sent: false, autoVerified: true, emailFailed: false, skipped: true };
  }

  if (!isEmailConfigured()) {
    console.warn("[email-verification] Email not configured — auto-verifying user");
    await autoVerifyUser(userId, email);
    return { sent: false, autoVerified: true, emailFailed: false };
  }

  const code = generateSixDigitCode();
  const expiry = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS);

  await prisma.user.update({
    where: { id: userId },
    data: {
      emailVerificationCode: code,
      emailVerificationExpiry: expiry,
    },
  });
  await resetVerificationAttempts(userId);

  const result = await sendEmail(
    email,
    `Verify your ${BRAND_NAME} email`,
    emailVerificationHtml(code)
  );

  if (!result.sent) {
    console.error("[email-verification] send failed:", result.error);
    const autoVerify =
      shouldAutoVerifyOnEmailFail(result.error) ||
      process.env.SKIP_EMAIL_VERIFICATION === "true";
    if (autoVerify) {
      await autoVerifyUser(userId, email);
      return { sent: false, autoVerified: true, emailFailed: true, error: result.error };
    }
    return { sent: false, autoVerified: false, emailFailed: true, error: result.error };
  }

  return { sent: true, autoVerified: false };
}

export async function sendWelcomeAfterVerification(userId: string, email: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  });
  if (!user) return;

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const referralLink = `${baseUrl}/register?ref=${user.referralCode}`;
  await sendEmail(email, `Welcome to ${BRAND_NAME}`, welcomeEmailHtml(email, referralLink));
}
