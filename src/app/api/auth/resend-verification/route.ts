import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkVerificationLockout } from "@/lib/auth-rate-limit";
import { sendVerificationEmail } from "@/lib/email-verification";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: String(email).trim().toLowerCase() },
    });

    if (!user) {
      return NextResponse.json({ success: true });
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

    await sendVerificationEmail(user.id, user.email);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
