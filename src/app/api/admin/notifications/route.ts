import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const notifications = await prisma.notification.findMany({
    include: { user: { select: { email: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(notifications);
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { userId, message } = await req.json();
  if (!userId || !message) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  await createNotification(userId, message);
  return NextResponse.json({ success: true });
}
