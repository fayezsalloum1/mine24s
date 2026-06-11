import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import {
  generateDepositAddress,
  generateTronDepositAddress,
  getConfiguredTreasuryAddresses,
  getNextWalletIndex,
  getPlatformDepositAddresses,
  usesCustomPlatformWallet,
} from "@/lib/wallet";
import { normalizeReferralCode } from "@/lib/referral";
import { sendVerificationEmail } from "@/lib/email-verification";
import { isValidEmail } from "@/lib/password-strength";

export async function POST(req: Request) {
  try {
    const { email, password, fullName, phoneNumber, referralCode, acceptTerms } = await req.json();

    if (!email || !password || !fullName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    if (String(password).length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    if (!acceptTerms) {
      return NextResponse.json({ error: "You must accept the terms of service" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    let referredBy = null;
    if (referralCode) {
      const normalizedCode = normalizeReferralCode(String(referralCode));
      const referrer = await prisma.user.findUnique({
        where: { referralCode: normalizedCode },
      });
      if (referrer) referredBy = referrer.id;
    }

    let walletIndex: number;
    let depositAddress: string;
    let tronDepositAddress: string;

    if (usesCustomPlatformWallet()) {
      if (!getConfiguredTreasuryAddresses()) {
        return NextResponse.json(
          { error: "Platform wallet not configured. Set ADMIN_TREASURY_EVM and ADMIN_TREASURY_TRC20." },
          { status: 500 }
        );
      }
      const platform = getPlatformDepositAddresses();
      walletIndex = 0;
      depositAddress = platform.depositAddress;
      tronDepositAddress = platform.tronDepositAddress;
    } else {
      const agg = await prisma.user.aggregate({ _max: { walletIndex: true } });
      walletIndex = getNextWalletIndex(agg._max.walletIndex);
      depositAddress = generateDepositAddress(walletIndex);
      tronDepositAddress = generateTronDepositAddress(walletIndex);
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);
    const newReferralCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        fullName: String(fullName).trim(),
        phoneNumber: phoneNumber ? String(phoneNumber).trim() : null,
        walletIndex,
        depositAddress,
        tronDepositAddress,
        referralCode: newReferralCode,
        referredBy,
        emailVerified: false,
      },
    });

    await sendVerificationEmail(user.id, user.email);

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email },
      requiresVerification: true,
    });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
