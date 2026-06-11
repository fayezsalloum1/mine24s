import { prisma } from "@/lib/prisma";
import { sendEmail, emailVerificationHtml, welcomeEmailHtml } from "@/lib/email";
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
  await sendWelcomeAfterVerification(userId, email);
}

export async function sendVerificationEmail(userId: string, email: string) {
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
    console.error("[email-verification] send failed, auto-verifying:", result.error);
    await autoVerifyUser(userId, email);
    return { sent: false, autoVerified: true, emailFailed: true };
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
