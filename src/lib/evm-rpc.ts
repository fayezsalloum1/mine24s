import { ethers } from "ethers";
import { USDT } from "@/lib/constants";

const ERC20_ABI = ["function balanceOf(address account) view returns (uint256)"];

const CHAIN_IDS = { ERC20: 1, BEP20: 56 } as const;

function getRpcCandidates(network: "ERC20" | "BEP20") {
  const primary = USDT[network].rpc?.trim();
  const envFallback =
    network === "ERC20"
      ? process.env.ETH_RPC_FALLBACK_URL?.trim()
      : process.env.BSC_RPC_FALLBACK_URL?.trim();

  const defaults =
    network === "ERC20"
      ? ["https://ethereum.publicnode.com", "https://rpc.ankr.com/eth", "https://1rpc.io/eth"]
      : ["https://bsc.publicnode.com", "https://rpc.ankr.com/bsc", "https://1rpc.io/bnb"];

  const unique = new Set([primary, envFallback, ...defaults].filter(Boolean) as string[]);
  return Array.from(unique);
}

export function createEvmProvider(network: "ERC20" | "BEP20", rpcUrl: string) {
  const chainId = CHAIN_IDS[network];
  const networkish = ethers.Network.from(chainId);
  return new ethers.JsonRpcProvider(rpcUrl, networkish, { staticNetwork: networkish });
}

function shortenRpcError(err: unknown) {
  if (err instanceof Error) {
    const msg = err.message;
    if (msg.includes("CALL_EXCEPTION")) {
      return "RPC node rejected the balance request. Set a reliable ETH_RPC_URL / BSC_RPC_URL in Vercel.";
    }
    if (msg.includes("timeout") || msg.includes("TIMEOUT")) {
      return "RPC request timed out. Try a dedicated RPC provider (Infura, Alchemy, Ankr).";
    }
    return msg.length > 180 ? `${msg.slice(0, 180)}…` : msg;
  }
  return "Unknown RPC error";
}

export async function fetchUsdtBalance(
  network: "ERC20" | "BEP20",
  address: string
): Promise<{ formatted: number; rpcUrl?: string; error?: string }> {
  if (!address?.trim()) {
    return { formatted: 0, error: "Treasury address not configured" };
  }

  let checksummed: string;
  try {
    checksummed = ethers.getAddress(address.trim());
  } catch {
    return { formatted: 0, error: `Invalid ${network} address: ${address}` };
  }

  const config = USDT[network];
  const candidates = getRpcCandidates(network);
  let lastError: unknown;

  for (const rpcUrl of candidates) {
    try {
      const provider = createEvmProvider(network, rpcUrl);
      const usdt = new ethers.Contract(config.contract, ERC20_ABI, provider);
      const balance: bigint = await usdt.balanceOf.staticCall(checksummed);
      return {
        formatted: Number(ethers.formatUnits(balance, config.decimals)),
        rpcUrl,
      };
    } catch (err) {
      lastError = err;
      console.warn(`[evm-rpc] ${network} balanceOf failed via ${rpcUrl}:`, err);
    }
  }

  return { formatted: 0, error: shortenRpcError(lastError) };
}

export async function fetchNativeBalance(
  network: "ERC20" | "BEP20",
  address: string
): Promise<{ formatted: number; error?: string }> {
  if (!address?.trim()) return { formatted: 0, error: "Address not configured" };

  let checksummed: string;
  try {
    checksummed = ethers.getAddress(address.trim());
  } catch {
    return { formatted: 0, error: `Invalid address: ${address}` };
  }

  for (const rpcUrl of getRpcCandidates(network)) {
    try {
      const provider = createEvmProvider(network, rpcUrl);
      const balance = await provider.getBalance(checksummed);
      return { formatted: Number(ethers.formatEther(balance)) };
    } catch (err) {
      console.warn(`[evm-rpc] ${network} native balance failed via ${rpcUrl}:`, err);
    }
  }

  return { formatted: 0, error: "Could not fetch native balance" };
}

export function getEvmProvider(network: "ERC20" | "BEP20") {
  return createEvmProvider(network, getRpcCandidates(network)[0]);
}
