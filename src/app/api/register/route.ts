import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { assignWalletForNewUser, WalletConfigError } from "@/lib/wallet";
import { normalizeReferralCode } from "@/lib/referral";
import { autoVerifyUser, sendVerificationEmail } from "@/lib/email-verification";
import { isValidEmail } from "@/lib/password-strength";
import { isEmailConfigured } from "@/lib/email";

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

    if (acceptTerms !== true) {
      return NextResponse.json({ error: "You must accept the terms of service" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      if (!existing.emailVerified) {
        let autoVerified = false;
        try {
          const result = await sendVerificationEmail(existing.id, existing.email);
          autoVerified = result.autoVerified;
        } catch (emailErr) {
          console.error("[register] resend verification failed:", emailErr);
          if (!isEmailConfigured()) {
            await autoVerifyUser(existing.id, existing.email);
            autoVerified = true;
          }
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
          message: "Account already exists but email is not verified. A new verification code has been sent.",
        });
      }
      return NextResponse.json(
        { error: "An account with this email already exists. Please log in instead.", alreadyRegistered: true },
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

    const { walletIndex, depositAddress, tronDepositAddress } = await assignWalletForNewUser(prisma);
    const hashedPassword = await bcrypt.hash(String(password), 10);
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
        referralCode: newReferralCode,
        referredBy,
        emailVerified: false,
      },
    });

    let requiresVerification = true;
    let autoVerified = false;
    try {
      const result = await sendVerificationEmail(user.id, user.email);
      requiresVerification = !result.autoVerified;
      autoVerified = result.autoVerified;
    } catch (emailErr) {
      console.error("[register] verification email failed:", emailErr);
      if (!isEmailConfigured()) {
        await autoVerifyUser(user.id, user.email);
        requiresVerification = false;
        autoVerified = true;
      }
    }

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email },
      requiresVerification,
      autoVerified,
      emailSent: isEmailConfigured(),
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
