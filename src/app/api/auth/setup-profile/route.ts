import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { assignWalletForNewUser, WalletConfigError } from "@/lib/wallet";
import { normalizeReferralCode } from "@/lib/referral";
import { getSupabaseAuthUser } from "@/lib/session";
import { createNotification, notifyAdmins } from "@/lib/notifications";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const supabaseUser = await getSupabaseAuthUser();
    if (!supabaseUser?.email) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const email = supabaseUser.email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          supabaseUserId: supabaseUser.id,
          emailVerified: true,
          ...(body.fullName ? { fullName: String(body.fullName).trim() } : {}),
          ...(body.phoneNumber ? { phoneNumber: String(body.phoneNumber).trim() } : {}),
        },
      });
      return NextResponse.json({ success: true, userId: existing.id, existing: true });
    }

    let referredBy: string | null = null;
    const referralCode = body.referralCode ? normalizeReferralCode(String(body.referralCode)) : null;
    if (referralCode) {
      const referrer = await prisma.user.findUnique({ where: { referralCode } });
      if (referrer) referredBy = referrer.id;
    }

    const { walletIndex, depositAddress, tronDepositAddress, solanaDepositAddress } =
      await assignWalletForNewUser(prisma);
    const newReferralCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    const unusablePassword = await bcrypt.hash(
      "supabase:" + randomBytes(24).toString("hex"),
      10
    );

    const fullName =
      String(body.fullName || "").trim() ||
      (supabaseUser.user_metadata?.full_name as string | undefined)?.trim() ||
      email.split("@")[0];

    const user = await prisma.user.create({
      data: {
        email,
        password: unusablePassword,
        fullName,
        phoneNumber: body.phoneNumber ? String(body.phoneNumber).trim() : null,
        walletIndex,
        depositAddress,
        tronDepositAddress,
        solanaDepositAddress,
        referralCode: newReferralCode,
        referredBy,
        emailVerified: true,
        supabaseUserId: supabaseUser.id,
      },
    });

    await createNotification(
      user.id,
      "Welcome to Simple Mining! Browse plans and start earning — 100% principal return at completion."
    );
    await notifyAdmins(`[New user] ${email} registered.`);

    return NextResponse.json({ success: true, userId: user.id, existing: false });
  } catch (err) {
    console.error("[setup-profile]", err);

    if (err instanceof WalletConfigError) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }

    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "Account already exists" }, { status: 409 });
    }

    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
