import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { storeOTP } from "@/lib/otp-store";
import { sendSMS } from "@/lib/sms";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const { phoneNumber } = await req.json();
  if (!phoneNumber) {
    return NextResponse.json({ error: "Phone number required" }, { status: 400 });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  await storeOTP(auth.user!.id, code);

  await prisma.user.update({
    where: { id: auth.user!.id },
    data: { phoneNumber },
  });

  await sendSMS(phoneNumber, `Your Cloud Mining verification code is: ${code}`);

  return NextResponse.json({ success: true });
}
