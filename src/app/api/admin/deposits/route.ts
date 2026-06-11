import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { sendEmail, depositConfirmedHtml } from "@/lib/email";
import { sendSMS } from "@/lib/sms";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const deposits = await prisma.transaction.findMany({
    where: { type: "DEPOSIT", amount: { gte: 0 } },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(deposits);
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id, action } = await req.json();

  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!transaction) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (transaction.type !== "DEPOSIT" || transaction.status !== "PENDING") {
    return NextResponse.json({ error: "Deposit already processed or invalid" }, { status: 400 });
  }

  if (action === "confirm") {
    await prisma.$transaction([
      prisma.transaction.update({ where: { id }, data: { status: "CONFIRMED" } }),
      prisma.user.update({
        where: { id: transaction.userId },
        data: { balance: { increment: transaction.amount } },
      }),
    ]);

    const message = `Deposit of $${transaction.amount.toFixed(2)} confirmed!`;
    await createNotification(transaction.userId, message);
    await sendEmail(
      transaction.user.email,
      "Deposit Confirmed",
      depositConfirmedHtml(transaction.amount)
    );
    if (transaction.user.phoneNumber && transaction.user.phoneVerified) {
      await sendSMS(transaction.user.phoneNumber, message);
    }
  } else if (action === "reject") {
    await prisma.transaction.update({ where: { id }, data: { status: "REJECTED" } });
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}