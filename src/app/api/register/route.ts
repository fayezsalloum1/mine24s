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
import { sendEmail, welcomeEmailHtml } from "@/lib/email";
import { BRAND_NAME } from "@/lib/constants";
import { normalizeReferralCode } from "@/lib/referral";

export async function POST(req: Request) {
  try {
    const { email, password, referralCode } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
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
    const hashedPassword = await bcrypt.hash(password, 10);
    const newReferralCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        walletIndex,
        depositAddress,
        tronDepositAddress,
        referralCode: newReferralCode,
        referredBy,
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const referralLink = `${baseUrl}/register?ref=${newReferralCode}`;
    await sendEmail(
      email,
      `Welcome to ${BRAND_NAME}`,
      welcomeEmailHtml(email, referralLink)
    );

    return NextResponse.json({ success: true, user: { id: user.id, email: user.email } });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
