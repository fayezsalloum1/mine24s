import { ethers } from "ethers";
import { fromPrivateKey } from "tronweb/utils";

const mnemonic = process.env.MASTER_WALLET_MNEMONIC;

export const ADMIN_WALLET_INDEX = Number(process.env.ADMIN_WALLET_INDEX ?? 0);
export const EVM_DERIVATION_PATH = "m/44'/60'/0'/0";
export const TRON_DERIVATION_PATH = "m/44'/195'/0'/0";
/** @deprecated use EVM_DERIVATION_PATH */
export const DERIVATION_PATH = EVM_DERIVATION_PATH;

export function usesCustomPlatformWallet() {
  return process.env.USE_CUSTOM_PLATFORM_WALLET === "true";
}

export function getConfiguredTreasuryAddresses() {
  const evm = process.env.ADMIN_TREASURY_EVM?.trim();
  const trc = process.env.ADMIN_TREASURY_TRC20?.trim();
  if (!evm || !trc) return null;

  return {
    walletIndex: null as number | null,
    source: "custom" as const,
    ERC20: evm,
    BEP20: process.env.ADMIN_TREASURY_BEP20?.trim() || evm,
    TRC20: trc,
  };
}

function requireMnemonic(): string {
  if (!mnemonic) throw new Error("MASTER_WALLET_MNEMONIC is not configured");
  return mnemonic;
}

export function hasHdWalletConfigured() {
  return Boolean(mnemonic);
}

export function getEvmWallet(walletIndex: number) {
  return ethers.HDNodeWallet.fromPhrase(
    requireMnemonic(),
    undefined,
    `${EVM_DERIVATION_PATH}/${walletIndex}`
  );
}

export function getTronWallet(walletIndex: number) {
  return ethers.HDNodeWallet.fromPhrase(
    requireMnemonic(),
    undefined,
    `${TRON_DERIVATION_PATH}/${walletIndex}`
  );
}

export function getAdminAddresses() {
  const custom = getConfiguredTreasuryAddresses();
  if (custom) return custom;

  if (!mnemonic) {
    return {
      walletIndex: null,
      source: "unconfigured" as const,
      ERC20: "",
      BEP20: "",
      TRC20: "",
    };
  }

  return {
    walletIndex: ADMIN_WALLET_INDEX,
    source: "hd" as const,
    ERC20: generateDepositAddress(ADMIN_WALLET_INDEX),
    BEP20: generateDepositAddress(ADMIN_WALLET_INDEX),
    TRC20: generateTronDepositAddress(ADMIN_WALLET_INDEX),
  };
}

export function generateDepositAddress(walletIndex: number): string {
  return getEvmWallet(walletIndex).address;
}

export function generateTronDepositAddress(walletIndex: number): string {
  const privateKey = getTronWallet(walletIndex).privateKey.slice(2);
  const address = fromPrivateKey(privateKey);
  if (!address) throw new Error("Failed to derive TRON address");
  return address;
}

export function getDepositAddressForNetwork(
  walletIndex: number,
  network: "ERC20" | "BEP20" | "TRC20"
) {
  if (usesCustomPlatformWallet()) {
    const treasury = getConfiguredTreasuryAddresses();
    if (!treasury) {
      throw new Error("Set ADMIN_TREASURY_EVM and ADMIN_TREASURY_TRC20 in .env");
    }
    return network === "TRC20" ? treasury.TRC20 : treasury[network];
  }

  if (network === "TRC20") {
    return generateTronDepositAddress(walletIndex);
  }
  return generateDepositAddress(walletIndex);
}

export function getPlatformDepositAddresses() {
  const treasury = getConfiguredTreasuryAddresses();
  if (!treasury) {
    throw new Error("ADMIN_TREASURY_EVM and ADMIN_TREASURY_TRC20 are required");
  }
  return {
    depositAddress: treasury.ERC20,
    tronDepositAddress: treasury.TRC20,
  };
}

/** Next index for registration. Index 0 is reserved for admin / sweep collection wallet only. */
export function getNextWalletIndex(currentMax: number | null): number {
  return Math.max(1, (currentMax ?? 0) + 1);
}

export class WalletConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WalletConfigError";
  }
}

/** Unique walletIndex per user; shared treasury addresses when using custom platform wallet. */
export async function assignWalletForNewUser(prisma: {
  user: { aggregate: (args: { _max: { walletIndex: true } }) => Promise<{ _max: { walletIndex: number | null } }> };
}) {
  const agg = await prisma.user.aggregate({ _max: { walletIndex: true } });
  const walletIndex = getNextWalletIndex(agg._max.walletIndex);

  if (usesCustomPlatformWallet()) {
    if (!getConfiguredTreasuryAddresses()) {
      throw new WalletConfigError(
        "Platform wallet not configured. Set ADMIN_TREASURY_EVM and ADMIN_TREASURY_TRC20."
      );
    }
    const platform = getPlatformDepositAddresses();
    return {
      walletIndex,
      depositAddress: platform.depositAddress,
      tronDepositAddress: platform.tronDepositAddress,
    };
  }

  if (!hasHdWalletConfigured()) {
    throw new WalletConfigError(
      "Wallet not configured. Set USE_CUSTOM_PLATFORM_WALLET=true with treasury addresses, or MASTER_WALLET_MNEMONIC."
    );
  }

  return {
    walletIndex,
    depositAddress: generateDepositAddress(walletIndex),
    tronDepositAddress: generateTronDepositAddress(walletIndex),
  };
}
