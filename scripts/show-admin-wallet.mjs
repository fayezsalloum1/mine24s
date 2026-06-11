import { readFileSync } from "fs";
import { resolve } from "path";
import { ethers } from "ethers";
import { fromPrivateKey } from "tronweb/utils";

try {
  const envFile = readFileSync(resolve(process.cwd(), ".env"), "utf8");
  for (const line of envFile.split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
    }
  }
} catch {
  // .env optional if vars already in environment
}

const useCustom = process.env.USE_CUSTOM_PLATFORM_WALLET === "true";
const customEvm = process.env.ADMIN_TREASURY_EVM?.trim();
const customTrc = process.env.ADMIN_TREASURY_TRC20?.trim();

console.log("\n=== Platform Wallet Addresses ===\n");

if (useCustom) {
  if (!customEvm || !customTrc) {
    console.error("USE_CUSTOM_PLATFORM_WALLET=true but ADMIN_TREASURY_EVM / ADMIN_TREASURY_TRC20 missing");
    process.exit(1);
  }
  console.log("Mode: YOUR WALLET (from .env)\n");
  console.log("ERC20 / BEP20:", customEvm);
  console.log("TRC20:        ", customTrc);
  console.log("\nUsers deposit directly to these addresses.\n");
} else {
  const mnemonic = process.env.MASTER_WALLET_MNEMONIC;
  const index = Number(process.env.ADMIN_WALLET_INDEX ?? 0);
  if (!mnemonic) {
    console.error("Set USE_CUSTOM_PLATFORM_WALLET=true with your addresses, OR set MASTER_WALLET_MNEMONIC");
    process.exit(1);
  }
  const evmWallet = ethers.HDNodeWallet.fromPhrase(mnemonic, undefined, `m/44'/60'/0'/0/${index}`);
  const tronWallet = ethers.HDNodeWallet.fromPhrase(mnemonic, undefined, `m/44'/195'/0'/0/${index}`);
  const tronAddress = fromPrivateKey(tronWallet.privateKey.slice(2));
  console.log("Mode: AUTO-GENERATED (from mnemonic)\n");
  console.log("ERC20 / BEP20:", evmWallet.address);
  console.log("TRC20:        ", tronAddress, "(Tron BIP44 path m/44'/195'/0'/0/" + index + ")");
  console.log("\nFund with ETH, BNB, TRX for sweep gas.\n");
}
