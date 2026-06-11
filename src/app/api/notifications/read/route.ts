import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  await prisma.notification.updateMany({
    where: { userId: auth.user!.id, isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json({ success: true });
}
