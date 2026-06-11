import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { sendEmail, withdrawalStatusHtml } from "@/lib/email";
import { sendSMS } from "@/lib/sms";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const withdrawals = await prisma.withdrawalRequest.findMany({
    include: { user: true },
    orderBy: { requestedAt: "desc" },
  });
  return NextResponse.json(withdrawals);
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id, action } = await req.json();

  const withdrawal = await prisma.withdrawalRequest.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!withdrawal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (withdrawal.status !== "PENDING") {
    return NextResponse.json({ error: "Withdrawal already processed" }, { status: 400 });
  }

  if (action === "confirm") {
    if (withdrawal.user.balance < withdrawal.amount) {
      return NextResponse.json({ error: "Insufficient user balance" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      const locked = await tx.withdrawalRequest.updateMany({
        where: { id, status: "PENDING" },
        data: { status: "CONFIRMED", processedAt: new Date() },
      });
      if (locked.count !== 1) throw new Error("Withdrawal already processed");

      const debit = await tx.user.updateMany({
        where: { id: withdrawal.userId, balance: { gte: withdrawal.amount } },
        data: { balance: { decrement: withdrawal.amount } },
      });
      if (debit.count !== 1) throw new Error("Insufficient user balance");

      await tx.transaction.create({
        data: {
          userId: withdrawal.userId,
          type: "WITHDRAWAL",
          amount: withdrawal.amount,
          status: "CONFIRMED",
        },
      });
    });

    const message = `Withdrawal of $${withdrawal.amount.toFixed(2)} approved!`;
    await createNotification(withdrawal.userId, message);
    await sendEmail(
      withdrawal.user.email,
      "Withdrawal Approved",
      withdrawalStatusHtml(withdrawal.amount, true)
    );
    if (withdrawal.user.phoneNumber && withdrawal.user.phoneVerified) {
      await sendSMS(withdrawal.user.phoneNumber, message);
    }
  } else if (action === "reject") {
    await prisma.withdrawalRequest.update({
      where: { id },
      data: { status: "REJECTED", processedAt: new Date() },
    });

    const message = `Withdrawal of $${withdrawal.amount.toFixed(2)} rejected.`;
    await createNotification(withdrawal.userId, message);
    await sendEmail(
      withdrawal.user.email,
      "Withdrawal Rejected",
      withdrawalStatusHtml(withdrawal.amount, false)
    );
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}