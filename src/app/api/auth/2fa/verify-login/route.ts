import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { set2FAVerified } from "@/lib/otp-store";
import { verify2FACode } from "@/lib/totp";
import { getSupabaseAuthUser } from "@/lib/session";

export async function POST(req: Request) {
  const { email, code } = await req.json();

  if (!email || !code) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const supabaseUser = await getSupabaseAuthUser();
  if (!supabaseUser?.email || supabaseUser.email.trim().toLowerCase() !== String(email).trim().toLowerCase()) {
    return NextResponse.json({ error: "Session expired. Log in again." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: String(email).trim().toLowerCase() },
  });
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  if (user.isFrozen) {
    return NextResponse.json({ error: "Account frozen" }, { status: 403 });
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
