import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { create2FASecret, create2FAUri } from "@/lib/totp";

export async function POST() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const secret = create2FASecret();
  await prisma.user.update({
    where: { id: auth.user!.id },
    data: { twoFactorSecret: secret, twoFactorEnabled: false },
  });

  const otpauth = create2FAUri(auth.user!.email, secret);
  const qrDataUrl = await QRCode.toDataURL(otpauth);

  return NextResponse.json({ qrDataUrl, secret });
}
