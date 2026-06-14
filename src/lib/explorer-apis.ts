import { USDT } from "@/lib/constants";
import { getHeliusApiKey } from "@/lib/solana-wallet";

export type IncomingTransfer = {
  txHash: string;
  to: string;
  amount: number;
  confirmations: number;
};

type EvmExplorerRow = {
  hash?: string;
  to?: string;
  value?: string;
  confirmations?: string;
  contractAddress?: string;
};

function getTronApiKey() {
  return process.env.TRONGRID_API_KEY?.trim() || process.env.TRONSCAN_API_KEY?.trim() || "";
}

export function hasExplorerApiForNetwork(network: string) {
  if (network === "ERC20") return Boolean(process.env.ETHERSCAN_API_KEY?.trim());
  if (network === "BEP20") return Boolean(process.env.BSCSCAN_API_KEY?.trim());
  if (network === "TRC20") return Boolean(getTronApiKey());
  if (network === "SOL") return Boolean(getHeliusApiKey());
  return false;
}

function parseEvmTransfers(
  rows: EvmExplorerRow[],
  targetAddress: string,
  decimals: number
): IncomingTransfer[] {
  const target = targetAddress.toLowerCase();

  return rows
    .filter((row) => row.hash && row.to?.toLowerCase() === target)
    .map((row) => ({
      txHash: row.hash!,
      to: row.to!,
      amount: Number(row.value) / Math.pow(10, decimals),
      confirmations: Math.max(0, Number(row.confirmations ?? 0)),
    }))
    .filter((row) => row.amount > 0);
}

async function fetchEvmExplorerTransfers(
  network: "ERC20" | "BEP20",
  address: string
): Promise<IncomingTransfer[]> {
  const config = USDT[network];
  const apiKey =
    network === "ERC20"
      ? process.env.ETHERSCAN_API_KEY?.trim()
      : process.env.BSCSCAN_API_KEY?.trim();

  if (!apiKey) return [];

  const params = new URLSearchParams({
    module: "account",
    action: "tokentx",
    contractaddress: config.contract,
    address,
    page: "1",
    offset: "30",
    sort: "desc",
    apikey: apiKey,
  });

  if (network === "ERC20") {
    params.set("chainid", "1");
  }

  const baseUrl =
    network === "ERC20"
      ? "https://api.etherscan.io/v2/api"
      : "https://api.bscscan.com/api";

  const res = await fetch(`${baseUrl}?${params.toString()}`);
  const data = await res.json();

  if (data.status !== "1" || !Array.isArray(data.result)) {
    if (data.message && data.message !== "No transactions found") {
      console.warn(`[explorer-apis] ${network} scan warning:`, data.message || data.result);
    }
    return [];
  }

  return parseEvmTransfers(data.result, address, config.decimals);
}

export async function fetchEvmUsdtTransfers(
  network: "ERC20" | "BEP20",
  address: string
): Promise<IncomingTransfer[]> {
  if (!address?.trim()) return [];
  if (!hasExplorerApiForNetwork(network)) return [];
  return fetchEvmExplorerTransfers(network, address.trim());
}

export async function fetchTronUsdtTransfers(address: string): Promise<IncomingTransfer[]> {
  if (!address?.trim()) return [];

  const url = `https://api.trongrid.io/v1/accounts/${address.trim()}/transactions/trc20?only_to=true&limit=30&contract_address=${USDT.TRC20.contract}`;
  const apiKey = getTronApiKey();
  const res = await fetch(url, {
    headers: apiKey ? { "TRON-PRO-API-KEY": apiKey } : {},
  });
  const data = await res.json();

  if (!Array.isArray(data?.data)) return [];

  return data.data
    .filter(
      (tx: { token_info?: { symbol?: string; address?: string }; transaction_id?: string }) =>
        tx.transaction_id &&
        (tx.token_info?.symbol === "USDT" || tx.token_info?.address === USDT.TRC20.contract)
    )
    .map(
      (tx: {
        transaction_id: string;
        to: string;
        value: string;
        confirmed?: boolean;
      }) => ({
        txHash: tx.transaction_id,
        to: tx.to,
        amount: Number(tx.value) / Math.pow(10, USDT.TRC20.decimals),
        confirmations: tx.confirmed === false ? 0 : 19,
      })
    )
    .filter((tx: IncomingTransfer) => tx.amount > 0);
}

type HeliusTokenTransfer = {
  fromUserAccount?: string;
  toUserAccount?: string;
  tokenAmount?: number;
  mint?: string;
};

type HeliusTransaction = {
  signature?: string;
  tokenTransfers?: HeliusTokenTransfer[];
  confirmationStatus?: string;
};

export async function fetchSolanaUsdtTransfers(address: string): Promise<IncomingTransfer[]> {
  if (!address?.trim()) return [];

  const apiKey = getHeliusApiKey();
  if (!apiKey) return [];

  const url = `https://api-mainnet.helius-rpc.com/v0/addresses/${address.trim()}/transactions?api-key=${apiKey}&limit=30`;
  const res = await fetch(url);
  const data = await res.json();

  if (!Array.isArray(data)) {
    console.warn("[explorer-apis] SOL scan warning:", data?.error || data?.message || "invalid response");
    return [];
  }

  const target = address.trim();
  const transfers: IncomingTransfer[] = [];

  for (const tx of data as HeliusTransaction[]) {
    if (!tx.signature || !Array.isArray(tx.tokenTransfers)) continue;

    const finalized =
      tx.confirmationStatus === "finalized" || tx.confirmationStatus === "confirmed";
    const confirmations = finalized ? 32 : 0;

    for (const tokenTransfer of tx.tokenTransfers) {
      if (tokenTransfer.mint !== USDT.SOL.mint) continue;
      if (tokenTransfer.toUserAccount !== target) continue;
      if (!tokenTransfer.tokenAmount || tokenTransfer.tokenAmount <= 0) continue;

      transfers.push({
        txHash: tx.signature,
        to: target,
        amount: tokenTransfer.tokenAmount,
        confirmations,
      });
    }
  }

  return transfers;
}

export function getMinConfirmations(network: string) {
  if (network === "ERC20") {
    return Number(process.env.DEPOSIT_MIN_CONFIRMATIONS_ERC20 || 12);
  }
  if (network === "BEP20") {
    return Number(process.env.DEPOSIT_MIN_CONFIRMATIONS_BEP20 || 15);
  }
  if (network === "TRC20") {
    return Number(process.env.DEPOSIT_MIN_CONFIRMATIONS_TRC20 || 1);
  }
  if (network === "SOL") {
    return Number(process.env.DEPOSIT_MIN_CONFIRMATIONS_SOL || 1);
  }
  return 1;
}
