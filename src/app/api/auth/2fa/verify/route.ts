import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { set2FAVerified } from "@/lib/otp-store";
import { verify2FACode } from "@/lib/totp";

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const { code } = await req.json();
  if (!code) {
    return NextResponse.json({ error: "Code required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: auth.user!.id } });
  if (!user?.twoFactorSecret) {
    return NextResponse.json({ error: "2FA not initialized" }, { status: 400 });
  }

  if (!verify2FACode(user.twoFactorSecret, code)) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorEnabled: true },
  });

  set2FAVerified(user.id);

  return NextResponse.json({ success: true });
}
