import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { verifyOTP } from "@/lib/otp-store";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const { code } = await req.json();
  if (!code) {
    return NextResponse.json({ error: "Code required" }, { status: 400 });
  }

  const isValid = await verifyOTP(auth.user!.id, code);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: auth.user!.id },
    data: { phoneVerified: true },
  });

  return NextResponse.json({ success: true });
}
