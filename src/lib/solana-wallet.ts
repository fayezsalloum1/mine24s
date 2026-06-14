import * as bip39 from "bip39";
import { derivePath } from "ed25519-hd-key";
import { Keypair } from "@solana/web3.js";

const mnemonic = process.env.MASTER_WALLET_MNEMONIC;
export const SOLANA_DERIVATION_PATH = "m/44'/501'";

function requireMnemonic(): string {
  if (!mnemonic) throw new Error("MASTER_WALLET_MNEMONIC is not configured");
  return mnemonic;
}

export function getHeliusApiKey() {
  return process.env.HELIUS_API_KEY?.trim() || process.env.SOLANA_API_KEY?.trim() || "";
}

export function hasSolanaConfigured() {
  return Boolean(mnemonic && getHeliusApiKey());
}

export function getSolanaRpcUrl() {
  const apiKey = getHeliusApiKey();
  if (!apiKey) {
    return "https://api.mainnet-beta.solana.com";
  }
  return `https://mainnet.helius-rpc.com/?api-key=${apiKey}`;
}

export function getSolanaKeypair(walletIndex: number) {
  const seed = bip39.mnemonicToSeedSync(requireMnemonic());
  const path = `${SOLANA_DERIVATION_PATH}/${walletIndex}'/0'`;
  const derived = derivePath(path, seed.toString("hex"));
  return Keypair.fromSeed(derived.key.slice(0, 32));
}

export function generateSolanaDepositAddress(walletIndex: number) {
  return getSolanaKeypair(walletIndex).publicKey.toBase58();
}
