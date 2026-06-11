import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { verify2FACode } from "@/lib/totp";

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const { code } = await req.json();
  if (!code) {
    return NextResponse.json({ error: "Code required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: auth.user!.id } });
  if (!user?.twoFactorSecret || !user.twoFactorEnabled) {
    return NextResponse.json({ error: "2FA not enabled" }, { status: 400 });
  }

  if (!verify2FACode(user.twoFactorSecret, code)) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorSecret: null, twoFactorEnabled: false },
  });

  return NextResponse.json({ success: true });
}
