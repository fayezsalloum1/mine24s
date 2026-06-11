import { prisma } from "@/lib/prisma";
import {
  MAX_VERIFICATION_ATTEMPTS,
  VERIFICATION_LOCKOUT_MS,
  MAX_PASSWORD_RESET_REQUESTS_PER_HOUR,
  PASSWORD_RESET_WINDOW_MS,
} from "@/lib/auth-codes";

export async function checkVerificationLockout(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailVerificationLockedUntil: true },
  });
  if (!user?.emailVerificationLockedUntil) return { locked: false as const };
  if (user.emailVerificationLockedUntil > new Date()) {
    return { locked: true as const, lockedUntil: user.emailVerificationLockedUntil };
  }
  await prisma.user.update({
    where: { id: userId },
    data: {
      emailVerificationAttempts: 0,
      emailVerificationLockedUntil: null,
    },
  });
  return { locked: false as const };
}

export async function recordFailedVerificationAttempt(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailVerificationAttempts: true },
  });
  const attempts = (user?.emailVerificationAttempts ?? 0) + 1;
  const locked = attempts >= MAX_VERIFICATION_ATTEMPTS;
  await prisma.user.update({
    where: { id: userId },
    data: {
      emailVerificationAttempts: attempts,
      emailVerificationLockedUntil: locked
        ? new Date(Date.now() + VERIFICATION_LOCKOUT_MS)
        : null,
    },
  });
  return { attempts, locked };
}

export async function resetVerificationAttempts(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      emailVerificationAttempts: 0,
      emailVerificationLockedUntil: null,
    },
  });
}

export async function canRequestPasswordReset(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      passwordResetRequestCount: true,
      passwordResetRequestWindow: true,
    },
  });
  if (!user) return true;

  const now = new Date();
  const windowStart = user.passwordResetRequestWindow;
  if (!windowStart || now.getTime() - windowStart.getTime() > PASSWORD_RESET_WINDOW_MS) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordResetRequestCount: 0,
        passwordResetRequestWindow: now,
      },
    });
    return true;
  }

  return user.passwordResetRequestCount < MAX_PASSWORD_RESET_REQUESTS_PER_HOUR;
}

export async function recordPasswordResetRequest(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      passwordResetRequestCount: true,
      passwordResetRequestWindow: true,
    },
  });
  if (!user) return;

  const now = new Date();
  const windowStart = user.passwordResetRequestWindow;
  const windowExpired =
    !windowStart || now.getTime() - windowStart.getTime() > PASSWORD_RESET_WINDOW_MS;

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordResetRequestWindow: windowExpired ? now : windowStart,
      passwordResetRequestCount: windowExpired ? 1 : user.passwordResetRequestCount + 1,
    },
  });
}
