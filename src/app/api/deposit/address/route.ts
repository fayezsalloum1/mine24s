import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import {
  DEPOSIT_NETWORKS,
  type DepositNetwork,
} from "@/lib/constants";
import {
  getConfiguredTreasuryAddresses,
  getDepositAddressForNetwork,
  usesCustomPlatformWallet,
} from "@/lib/wallet";
import { generateSolanaDepositAddress } from "@/lib/solana-wallet";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const network = searchParams.get("network") as DepositNetwork;

    if (!DEPOSIT_NETWORKS.includes(network)) {
      return NextResponse.json({ error: "Invalid network" }, { status: 400 });
    }

    if (usesCustomPlatformWallet()) {
      if (!getConfiguredTreasuryAddresses()) {
        return NextResponse.json(
          { error: "Set ADMIN_TREASURY_EVM and ADMIN_TREASURY_TRC20 in server .env" },
          { status: 500 }
        );
      }
      if (network === "SOL" && !process.env.ADMIN_TREASURY_SOL?.trim()) {
        return NextResponse.json(
          { error: "Set ADMIN_TREASURY_SOL in server .env for Solana deposits" },
          { status: 500 }
        );
      }
    } else if (!process.env.MASTER_WALLET_MNEMONIC) {
      return NextResponse.json(
        { error: "Wallet not configured on server" },
        { status: 500 }
      );
    }

    const walletIndex = auth.user!.walletIndex;
    let address = getDepositAddressForNetwork(walletIndex, network);

    if (network === "SOL" && !usesCustomPlatformWallet() && !address) {
      address = generateSolanaDepositAddress(walletIndex);
      await prisma.user.update({
        where: { id: auth.user!.id },
        data: { solanaDepositAddress: address },
      });
    } else if (
      network === "SOL" &&
      !usesCustomPlatformWallet() &&
      auth.user!.solanaDepositAddress !== address
    ) {
      await prisma.user.update({
        where: { id: auth.user!.id },
        data: { solanaDepositAddress: address },
      });
    }

    if (!address) {
      return NextResponse.json({ error: "Could not generate address" }, { status: 500 });
    }

    return NextResponse.json({
      address,
      network,
      walletIndex,
      mode: usesCustomPlatformWallet() ? "custom" : "hd",
    });
  } catch (err) {
    console.error("[deposit/address]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to get address" },
      { status: 500 }
    );
  }
}
