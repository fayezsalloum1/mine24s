import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  checkVerificationLockout,
  recordFailedVerificationAttempt,
  resetVerificationAttempts,
} from "@/lib/auth-rate-limit";
import { sendWelcomeAfterVerification } from "@/lib/email-verification";

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: String(email).trim().toLowerCase() },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ success: true, alreadyVerified: true });
    }

    const lockout = await checkVerificationLockout(user.id);
    if (lockout.locked) {
      return NextResponse.json(
        { error: "Too many failed attempts. Please try again later.", locked: true },
        { status: 429 }
      );
    }

    if (!user.emailVerificationCode || !user.emailVerificationExpiry) {
      return NextResponse.json({ error: "No verification code found. Please request a new one.", expired: true }, { status: 400 });
    }

    if (user.emailVerificationExpiry < new Date()) {
      return NextResponse.json({ error: "Verification code has expired.", expired: true }, { status: 400 });
    }

    if (user.emailVerificationCode !== String(code).trim()) {
      const result = await recordFailedVerificationAttempt(user.id);
      if (result.locked) {
        return NextResponse.json(
          { error: "Too many failed attempts. Please try again in 15 minutes.", locked: true },
          { status: 429 }
        );
      }
      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationCode: null,
        emailVerificationExpiry: null,
      },
    });
    await resetVerificationAttempts(user.id);
    await sendWelcomeAfterVerification(user.id, user.email);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
