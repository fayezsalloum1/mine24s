import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { assignWalletForNewUser, WalletConfigError } from "@/lib/wallet";
import { normalizeReferralCode } from "@/lib/referral";
import { sendVerificationEmail } from "@/lib/email-verification";
import { notifyAdmins, createNotification } from "@/lib/notifications";
import { isValidEmail } from "@/lib/password-strength";
import { isEmailConfigured } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, fullName, phoneNumber, referralCode, acceptTerms } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const resolvedFullName = String(fullName || "").trim() || normalizedEmail.split("@")[0];

    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    if (String(password).length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    if (acceptTerms !== true && acceptTerms !== "true") {
      return NextResponse.json({ error: "You must accept the terms of service" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      if (!existing.emailVerified) {
        await prisma.user.update({
          where: { id: existing.id },
          data: {
            password: hashedPassword,
            fullName: resolvedFullName,
            phoneNumber: phoneNumber ? String(phoneNumber).trim() : null,
          },
        });

        let autoVerified = false;
        let emailError: string | undefined;
        try {
          const result = await sendVerificationEmail(existing.id, existing.email);
          autoVerified = result.autoVerified;
          emailError = result.error;
        } catch (emailErr) {
          console.error("[register] resend verification failed:", emailErr);
          emailError = emailErr instanceof Error ? emailErr.message : "Could not send verification email";
        }

        if (autoVerified) {
          return NextResponse.json({
            success: true,
            requiresVerification: false,
            autoVerified: true,
            existingAccount: true,
            message: "Account activated. You can log in now.",
          });
        }

        return NextResponse.json({
          success: true,
          requiresVerification: true,
          existingAccount: true,
          emailSent: !emailError,
          emailError,
          message: emailError
            ? "Account found but verification email could not be sent. Contact support or try again later."
            : "Account found — we sent a new verification code to your email.",
        });
      }
      return NextResponse.json(
        { error: "This email is already registered. Please log in or reset your password.", alreadyRegistered: true },
        { status: 400 }
      );
    }

    let referredBy = null;
    if (referralCode) {
      const normalizedCode = normalizeReferralCode(String(referralCode));
      const referrer = await prisma.user.findUnique({
        where: { referralCode: normalizedCode },
      });
      if (referrer) referredBy = referrer.id;
    }

    const { walletIndex, depositAddress, tronDepositAddress, solanaDepositAddress } =
      await assignWalletForNewUser(prisma);
    const newReferralCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        fullName: resolvedFullName,
        phoneNumber: phoneNumber ? String(phoneNumber).trim() : null,
        walletIndex,
        depositAddress,
        tronDepositAddress,
        solanaDepositAddress,
        referralCode: newReferralCode,
        referredBy,
        emailVerified: false,
      },
    });

    let requiresVerification = true;
    let autoVerified = false;
    let emailError: string | undefined;
    try {
      const result = await sendVerificationEmail(user.id, user.email);
      requiresVerification = !result.autoVerified;
      autoVerified = result.autoVerified;
      emailError = result.error;
    } catch (emailErr) {
      console.error("[register] verification email failed:", emailErr);
      emailError = emailErr instanceof Error ? emailErr.message : "Could not send verification email";
      requiresVerification = true;
    }

    await createNotification(
      user.id,
      "Welcome to Simple Mining! Verify your email to start investing — browse plans and earn with 100% principal return at completion."
    );
    await notifyAdmins(`[New user] ${normalizedEmail} registered.`);

    try {
      const { ensureSupabaseAuthUser } = await import("@/lib/supabase/provision-auth-user");
      await ensureSupabaseAuthUser(normalizedEmail, String(password));
    } catch (linkErr) {
      console.warn("[register] Supabase link skipped:", linkErr);
    }

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email },
      requiresVerification,
      autoVerified,
      emailSent: isEmailConfigured() && !emailError,
      emailError,
    });
  } catch (err) {
    console.error("[register]", err);

    if (err instanceof WalletConfigError) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        return NextResponse.json({ error: "An account with this email already exists" }, { status: 400 });
      }
      if (err.code === "P2022") {
        return NextResponse.json(
          { error: "Database schema out of date. Run: npx prisma migrate deploy" },
          { status: 500 }
        );
      }
    }

    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("Unknown arg") || message.includes("does not exist")) {
      return NextResponse.json(
        { error: "Database migration required. Run: npx prisma migrate deploy" },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
