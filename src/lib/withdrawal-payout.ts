import { ethers } from "ethers";
import { TronWeb } from "tronweb";
import { USDT } from "@/lib/constants";
import { getEvmProvider } from "@/lib/evm-rpc";
import {
  ADMIN_WALLET_INDEX,
  generateTronDepositAddress,
  getAdminAddresses,
  getEvmWallet,
  getTronWallet,
} from "@/lib/wallet";

const ERC20_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
];

function createTronWeb(privateKeyHex: string) {
  return new TronWeb({
    fullHost: "https://api.trongrid.io",
    headers: process.env.TRONGRID_API_KEY
      ? { "TRON-PRO-API-KEY": process.env.TRONGRID_API_KEY }
      : {},
    privateKey: privateKeyHex,
  });
}

function toTokenAmount(amount: number, decimals: number) {
  const factor = BigInt(10) ** BigInt(decimals);
  const [whole, fraction = ""] = amount.toFixed(decimals).split(".");
  const paddedFraction = fraction.padEnd(decimals, "0").slice(0, decimals);
  return BigInt(whole) * factor + BigInt(paddedFraction || "0");
}

async function payoutEvm(
  network: "ERC20" | "BEP20",
  toAddress: string,
  amount: number
) {
  const config = USDT[network];
  const provider = getEvmProvider(network);
  const adminWallet = getEvmWallet(ADMIN_WALLET_INDEX).connect(provider);
  const usdt = new ethers.Contract(config.contract, ERC20_ABI, adminWallet);
  const tokenAmount = toTokenAmount(amount, config.decimals);

  const adminBalance = await usdt.balanceOf(adminWallet.address);
  if (adminBalance < tokenAmount) {
    throw new Error(`Insufficient USDT in admin ${network} wallet`);
  }

  const tx = await usdt.transfer(toAddress, tokenAmount);
  const receipt = await tx.wait();
  return {
    txHash: receipt?.hash ?? tx.hash,
    from: adminWallet.address,
    to: toAddress,
    amount,
    network,
  };
}

async function payoutTron(toAddress: string, amount: number) {
  const privateKey = getTronWallet(ADMIN_WALLET_INDEX).privateKey.slice(2);
  const tronWeb = createTronWeb(privateKey);
  const fromAddress = generateTronDepositAddress(ADMIN_WALLET_INDEX);
  const contract = await tronWeb.contract().at(USDT.TRC20.contract);
  const tokenAmount = toTokenAmount(amount, USDT.TRC20.decimals).toString();

  const rawBalance = await contract.balanceOf(fromAddress).call();
  if (BigInt(rawBalance.toString()) < BigInt(tokenAmount)) {
    throw new Error("Insufficient USDT in admin TRC20 wallet");
  }

  const trxBalance = await tronWeb.trx.getBalance(fromAddress);
  if (trxBalance < 5_000_000) {
    throw new Error("Insufficient TRX in admin wallet for withdrawal gas");
  }

  const txId = await contract.transfer(toAddress, tokenAmount).send({
    feeLimit: 100_000_000,
  });

  return {
    txHash: txId,
    from: fromAddress,
    to: toAddress,
    amount,
    network: "TRC20" as const,
  };
}

export async function sendWithdrawalPayout(
  network: string,
  toAddress: string,
  amount: number
) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Invalid withdrawal amount");
  }
  if (!toAddress?.trim()) {
    throw new Error("Withdrawal address is required");
  }

  const admin = getAdminAddresses();
  if (admin.source === "unconfigured") {
    throw new Error("Master wallet is not configured");
  }

  const destination = toAddress.trim();

  if (network === "ERC20" || network === "BEP20") {
    if (!ethers.isAddress(destination)) {
      throw new Error(`Invalid ${network} address`);
    }
    return payoutEvm(network, destination, amount);
  }

  if (network === "TRC20") {
    if (!destination.startsWith("T") || destination.length < 30) {
      throw new Error("Invalid TRC20 address");
    }
    return payoutTron(destination, amount);
  }

  throw new Error(`Unsupported network: ${network}`);
}
