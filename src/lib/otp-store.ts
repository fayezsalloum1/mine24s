import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const TWO_FA_COOKIE = "2fa_verified";

export function set2FAVerified(userId: string) {
  cookies().set(TWO_FA_COOKIE, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 300,
    path: "/",
  });
}

export function check2FAVerified(userId: string): boolean {
  const cookie = cookies().get(TWO_FA_COOKIE);
  return cookie?.value === userId;
}

export function clear2FAVerified() {
  cookies().delete(TWO_FA_COOKIE);
}

/** Stored in DB so OTP works across multiple server instances. */
export async function storeOTP(userId: string, code: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      phoneOtpCode: code,
      phoneOtpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });
}

export async function verifyOTP(userId: string, code: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { phoneOtpCode: true, phoneOtpExpiresAt: true },
  });

  if (!user?.phoneOtpCode || !user.phoneOtpExpiresAt) return false;

  if (user.phoneOtpExpiresAt < new Date()) {
    await prisma.user.update({
      where: { id: userId },
      data: { phoneOtpCode: null, phoneOtpExpiresAt: null },
    });
    return false;
  }

  if (user.phoneOtpCode !== code) return false;

  await prisma.user.update({
    where: { id: userId },
    data: { phoneOtpCode: null, phoneOtpExpiresAt: null },
  });
  return true;
}
