import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { sendEmail, withdrawalStatusHtml } from "@/lib/email";
import { sendSMS } from "@/lib/sms";
import { getProfitBalanceForUser } from "@/lib/profit-balance";
import { sendWithdrawalPayout } from "@/lib/withdrawal-payout";

export const dynamic = "force-dynamic";

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
    include: {
      user: {
        include: {
          userPlans: {
            where: { isActive: true },
            include: { plan: true },
          },
        },
      },
    },
  });
  if (!withdrawal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (withdrawal.status !== "PENDING") {
    return NextResponse.json({ error: "Withdrawal already processed" }, { status: 400 });
  }

  if (action === "confirm") {
    const profitBalance = await getProfitBalanceForUser(
      withdrawal.userId,
      withdrawal.user.balance,
      withdrawal.user.userPlans
    );

    if (profitBalance.availableProfitBalance < withdrawal.amount) {
      return NextResponse.json(
        {
          error: `Insufficient withdrawable profit. Available: $${profitBalance.availableProfitBalance.toFixed(2)}`,
        },
        { status: 400 }
      );
    }

    if (withdrawal.user.balance < withdrawal.amount) {
      return NextResponse.json({ error: "Insufficient user balance" }, { status: 400 });
    }

    if (!withdrawal.network || !withdrawal.withdrawalAddress) {
      return NextResponse.json({ error: "Withdrawal is missing network or address" }, { status: 400 });
    }

    let payout;
    try {
      payout = await sendWithdrawalPayout(
        withdrawal.network,
        withdrawal.withdrawalAddress,
        withdrawal.amount
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "On-chain payout failed";
      console.error("[admin/withdrawals] payout failed:", message);
      return NextResponse.json({ error: message }, { status: 502 });
    }

    try {
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
            network: withdrawal.network,
            txHash: payout.txHash,
          },
        });
      });
    } catch (err) {
      console.error("[admin/withdrawals] ledger update failed after payout:", payout.txHash, err);
      return NextResponse.json(
        {
          error:
            "USDT was sent on-chain but ledger update failed. Check admin panel and reconcile manually.",
          txHash: payout.txHash,
        },
        { status: 500 }
      );
    }

    const message = `Withdrawal of $${withdrawal.amount.toFixed(2)} approved and sent on ${withdrawal.network}. Tx: ${payout.txHash}`;
    await createNotification(withdrawal.userId, message);
    await sendEmail(
      withdrawal.user.email,
      "Withdrawal Approved",
      withdrawalStatusHtml(withdrawal.amount, true)
    );
    if (withdrawal.user.phoneNumber && withdrawal.user.phoneVerified) {
      await sendSMS(withdrawal.user.phoneNumber, message);
    }

    return NextResponse.json({ success: true, txHash: payout.txHash });
  }

  if (action === "reject") {
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
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
