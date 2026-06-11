import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  if (user.isFrozen) {
    return NextResponse.json({ error: "Account frozen", frozen: true }, { status: 403 });
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  if (!user.emailVerified) {
    return NextResponse.json(
      { error: "Please verify your email before logging in.", emailUnverified: true, email: user.email },
      { status: 403 }
    );
  }

  if (user.twoFactorEnabled) {
    return NextResponse.json({ requires2FA: true });
  }

  return NextResponse.json({ success: true });
}
