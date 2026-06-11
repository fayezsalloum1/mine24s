import { prisma } from "@/lib/prisma";
import { sendEmail, emailVerificationHtml, welcomeEmailHtml, isEmailConfigured } from "@/lib/email";
import { generateSixDigitCode, EMAIL_VERIFICATION_TTL_MS } from "@/lib/auth-codes";
import { resetVerificationAttempts } from "@/lib/auth-rate-limit";
import { BRAND_NAME } from "@/lib/constants";

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
  try {
    await sendWelcomeAfterVerification(userId, email);
  } catch (err) {
    console.error("[email-verification] welcome email failed:", err);
  }
}

export async function sendVerificationEmail(userId: string, email: string) {
  if (!isEmailConfigured()) {
    console.log(`[email-verification] SMTP not configured — auto-verifying ${email}`);
    await autoVerifyUser(userId, email);
    return { sent: false, autoVerified: true };
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

  try {
    await sendEmail(
      email,
      `Verify your ${BRAND_NAME} email`,
      emailVerificationHtml(code)
    );
    return { sent: true, autoVerified: false };
  } catch (err) {
    console.error("[email-verification] SMTP send failed, auto-verifying user:", err);
    await autoVerifyUser(userId, email);
    return { sent: false, autoVerified: true, emailFailed: true };
  }
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
