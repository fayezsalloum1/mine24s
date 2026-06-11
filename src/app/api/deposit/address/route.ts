import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import {
  getConfiguredTreasuryAddresses,
  getDepositAddressForNetwork,
  usesCustomPlatformWallet,
} from "@/lib/wallet";

export async function GET(req: Request) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const network = searchParams.get("network") as "ERC20" | "BEP20" | "TRC20";

    if (!["ERC20", "BEP20", "TRC20"].includes(network)) {
      return NextResponse.json({ error: "Invalid network" }, { status: 400 });
    }

    if (usesCustomPlatformWallet()) {
      if (!getConfiguredTreasuryAddresses()) {
        return NextResponse.json(
          { error: "Set ADMIN_TREASURY_EVM and ADMIN_TREASURY_TRC20 in server .env" },
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
    const address = getDepositAddressForNetwork(walletIndex, network);

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
