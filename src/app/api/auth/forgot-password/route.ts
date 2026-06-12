import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  sendEmail,
  passwordResetHtml,
  getEmailConfigStatus,
} from "@/lib/email";
import { generateResetToken, PASSWORD_RESET_TTL_MS } from "@/lib/auth-codes";
import {
  canRequestPasswordReset,
  recordPasswordResetRequest,
} from "@/lib/auth-rate-limit";
import { BRAND_NAME } from "@/lib/constants";

const GENERIC_SUCCESS =
  "If an account exists with that email, you will receive a password reset link shortly.";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const emailStatus = getEmailConfigStatus();
    if (!emailStatus.configured) {
      console.error("[forgot-password] email not configured:", emailStatus.issues);
      return NextResponse.json(
        {
          success: false,
          error:
            emailStatus.hint ||
            "Password reset emails are not configured yet. Set SMTP_FROM in Brevo and redeploy.",
        },
        { status: 503 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      return NextResponse.json({ success: true, message: GENERIC_SUCCESS });
    }

    const allowed = await canRequestPasswordReset(user.id);
    if (!allowed) {
      return NextResponse.json({ success: true, message: GENERIC_SUCCESS });
    }

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
    const result = await sendEmail(
      user.email,
      `Reset your ${BRAND_NAME} password`,
      passwordResetHtml(resetLink)
    );

    if (!result.sent) {
      console.error("[forgot-password] send failed:", normalizedEmail, result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Could not send reset email. Check Brevo sender (SMTP_FROM).",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, message: GENERIC_SUCCESS });
  } catch (err) {
    console.error("[forgot-password]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
