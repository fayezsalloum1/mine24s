import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) {
    return NextResponse.json({ valid: false, error: "Invalid token" }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: { passwordResetToken: token },
    select: { passwordResetExpiry: true },
  });

  if (!user?.passwordResetExpiry || user.passwordResetExpiry < new Date()) {
    return NextResponse.json({ valid: false, error: "Token expired or invalid" });
  }

  return NextResponse.json({ valid: true });
}

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (String(password).length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { passwordResetToken: String(token) },
    });

    if (!user?.passwordResetExpiry || user.passwordResetExpiry < new Date()) {
      return NextResponse.json({ error: "This reset link has expired or is invalid.", expired: true }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiry: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
