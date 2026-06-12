import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { usesCustomPlatformWallet } from "@/lib/wallet";
import { createNotification, notifyAdmins } from "@/lib/notifications";

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const { amount, network, txHash } = await req.json();
  const depositAmount = Number(amount);

  if (!Number.isFinite(depositAmount) || depositAmount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  if (!network || !["ERC20", "BEP20", "TRC20"].includes(network)) {
    return NextResponse.json({ error: "Invalid network" }, { status: 400 });
  }

  if (usesCustomPlatformWallet() && (!txHash || typeof txHash !== "string" || txHash.length < 10)) {
    return NextResponse.json(
      { error: "Transaction hash is required when using your own platform wallet" },
      { status: 400 }
    );
  }

  if (txHash) {
    const existing = await prisma.transaction.findFirst({
      where: { txHash, type: "DEPOSIT" },
    });
    if (existing) {
      return NextResponse.json({ error: "This transaction was already submitted" }, { status: 400 });
    }
  }

  await prisma.transaction.create({
    data: {
      userId: auth.user!.id,
      type: "DEPOSIT",
      amount: depositAmount,
      status: "PENDING",
      network,
      txHash: txHash?.trim() || null,
    },
  });

  await createNotification(
    auth.user!.id,
    `Deposit of $${depositAmount.toFixed(2)} (${network}) submitted — pending admin confirmation.`
  );
  await notifyAdmins(
    `[Deposit pending] ${auth.user!.email} submitted $${depositAmount.toFixed(2)} on ${network}.`
  );

  return NextResponse.json({
    success: true,
    message: usesCustomPlatformWallet()
      ? "Deposit submitted for admin review. Include the correct tx hash."
      : "Deposit notification sent.",
  });
}
