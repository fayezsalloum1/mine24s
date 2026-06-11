import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { set2FAVerified } from "@/lib/otp-store";
import { verify2FACode } from "@/lib/totp";

export async function POST(req: Request) {
  const { email, password, code } = await req.json();

  if (!email || !password || !code) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  if (user.isFrozen) {
    return NextResponse.json({ error: "Account frozen" }, { status: 403 });
  }

  if (!user.emailVerified) {
    return NextResponse.json({ error: "Please verify your email first" }, { status: 403 });
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  if (!user.twoFactorEnabled || !user.twoFactorSecret) {
    return NextResponse.json({ error: "2FA not enabled" }, { status: 400 });
  }

  if (!verify2FACode(user.twoFactorSecret, code)) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  set2FAVerified(user.id);

  return NextResponse.json({ success: true });
}
