import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, passwordResetHtml } from "@/lib/email";
import { generateResetToken, PASSWORD_RESET_TTL_MS } from "@/lib/auth-codes";
import {
  canRequestPasswordReset,
  recordPasswordResetRequest,
} from "@/lib/auth-rate-limit";
import { BRAND_NAME } from "@/lib/constants";

const GENERIC_SUCCESS =
  "If an account exists with that email, you will receive a password reset link shortly.";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (user) {
      const allowed = await canRequestPasswordReset(user.id);
      if (allowed) {
        const token = generateResetToken();
        const expiry = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
        await prisma.user.update({
          where: { id: user.id },
          data: {
            passwordResetToken: token,
            passwordResetExpiry: expiry,
          },
        });
        await recordPasswordResetRequest(user.id);

        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
        const resetLink = `${baseUrl}/reset-password?token=${token}`;
        await sendEmail(
          user.email,
          `Reset your ${BRAND_NAME} password`,
          passwordResetHtml(resetLink)
        );
      }
    }

    return NextResponse.json({ success: true, message: GENERIC_SUCCESS });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
