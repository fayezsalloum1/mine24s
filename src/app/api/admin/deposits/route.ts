import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { createNotification, notifyAdmins } from "@/lib/notifications";
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
    if (transaction.user.isFrozen) {
      return NextResponse.json({ error: "Cannot confirm deposit for a frozen account" }, { status: 400 });
    }

    try {
      await prisma.$transaction(async (tx) => {
        const locked = await tx.transaction.updateMany({
          where: { id, type: "DEPOSIT", status: "PENDING" },
          data: { status: "CONFIRMED" },
        });
        if (locked.count !== 1) throw new Error("ALREADY_PROCESSED");

        if (transaction.txHash && transaction.network) {
          const alreadyCredited = await tx.processedDeposit.findUnique({
            where: {
              network_txHash: { network: transaction.network, txHash: transaction.txHash },
            },
          });
          if (alreadyCredited) throw new Error("ALREADY_CREDITED");

          const duplicateConfirmed = await tx.transaction.findFirst({
            where: {
              id: { not: id },
              type: "DEPOSIT",
              status: "CONFIRMED",
              txHash: transaction.txHash,
              network: transaction.network,
            },
          });
          if (duplicateConfirmed) throw new Error("ALREADY_CREDITED");

          await tx.processedDeposit.create({
            data: {
              userId: transaction.userId,
              network: transaction.network,
              txHash: transaction.txHash,
              amount: transaction.amount,
            },
          });
        }

        await tx.user.update({
          where: { id: transaction.userId },
          data: { balance: { increment: transaction.amount } },
        });
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Confirm failed";
      if (msg === "ALREADY_PROCESSED" || msg === "ALREADY_CREDITED") {
        return NextResponse.json({ error: "Deposit already credited or processed" }, { status: 400 });
      }
      throw err;
    }

    const message = `Deposit of $${transaction.amount.toFixed(2)} confirmed!`;
    await createNotification(transaction.userId, message);
    await notifyAdmins(
      `[Deposit approved] ${transaction.user.email} — $${transaction.amount.toFixed(2)} credited.`
    );
    await sendEmail(
      transaction.user.email,
      "Deposit Confirmed",
      depositConfirmedHtml(transaction.amount)
    );
    if (transaction.user.phoneNumber && transaction.user.phoneVerified) {
      await sendSMS(transaction.user.phoneNumber, message);
    }
  } else if (action === "reject") {
    const rejected = await prisma.transaction.updateMany({
      where: { id, type: "DEPOSIT", status: "PENDING" },
      data: { status: "REJECTED" },
    });
    if (rejected.count !== 1) {
      return NextResponse.json({ error: "Deposit already processed or invalid" }, { status: 400 });
    }

    const message = `Your deposit request of $${transaction.amount.toFixed(2)} was rejected. Contact support if you need help.`;
    await createNotification(transaction.userId, message);
    await sendEmail(
      transaction.user.email,
      "Deposit Rejected",
      `<p>${message}</p>`
    );
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
