import { ethers } from "ethers";
import { TronWeb } from "tronweb";
import { USDT } from "@/lib/constants";
import {
  ADMIN_WALLET_INDEX,
  generateDepositAddress,
  generateTronDepositAddress,
  getAdminAddresses,
  getConfiguredTreasuryAddresses,
  getEvmWallet,
  getTronWallet,
  usesCustomPlatformWallet,
} from "@/lib/wallet";

const ERC20_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
];

export function isAutoSweepEnabled() {
  return process.env.AUTO_SWEEP_DEPOSITS !== "false";
}

export function isGasFundingEnabled() {
  return process.env.SWEEP_FUND_GAS !== "false";
}

async function getEvmUsdtBalance(network: "ERC20" | "BEP20", address: string) {
  const config = USDT[network];
  const provider = new ethers.JsonRpcProvider(config.rpc);
  const usdt = new ethers.Contract(config.contract, ERC20_ABI, provider);
  const balance = await usdt.balanceOf(address);
  return { balance, formatted: Number(ethers.formatUnits(balance, config.decimals)) };
}

async function fundEvmGas(network: "ERC20" | "BEP20", toAddress: string) {
  const config = USDT[network];
  const provider = new ethers.JsonRpcProvider(config.rpc);
  const adminWallet = getEvmWallet(ADMIN_WALLET_INDEX).connect(provider);
  const feeData = await provider.getFeeData();
  const gasPrice = feeData.gasPrice ?? ethers.parseUnits("20", "gwei");
  const gasAmount = gasPrice * BigInt(80000);
  const fundValue = (gasAmount * BigInt(120)) / BigInt(100);

  const adminNative = await provider.getBalance(adminWallet.address);
  if (adminNative < fundValue) {
    throw new Error(`Admin wallet needs ${network === "ERC20" ? "ETH" : "BNB"} to fund sweep gas`);
  }

  const tx = await adminWallet.sendTransaction({ to: toAddress, value: fundValue });
  await tx.wait();
  return tx.hash;
}

async function sweepEvm(network: "ERC20" | "BEP20", walletIndex: number) {
  if (walletIndex === ADMIN_WALLET_INDEX) return null;

  const config = USDT[network];
  const provider = new ethers.JsonRpcProvider(config.rpc);
  const sourceWallet = getEvmWallet(walletIndex).connect(provider);
  const adminAddress = getSweepDestination(network);
  const usdt = new ethers.Contract(config.contract, ERC20_ABI, sourceWallet);

  const tokenBalance = await usdt.balanceOf(sourceWallet.address);
  if (tokenBalance === BigInt(0)) return null;

  const nativeBalance = await provider.getBalance(sourceWallet.address);
  const feeData = await provider.getFeeData();
  const gasPrice = feeData.gasPrice ?? ethers.parseUnits("20", "gwei");
  const gasNeeded = gasPrice * BigInt(80000);

  if (nativeBalance < gasNeeded) {
    if (!isGasFundingEnabled()) {
      throw new Error(`No ${network === "ERC20" ? "ETH" : "BNB"} on sub-address for sweep`);
    }
    await fundEvmGas(network, sourceWallet.address);
  }

  const tx = await usdt.transfer(adminAddress, tokenBalance);
  const receipt = await tx.wait();
  return {
    txHash: receipt?.hash ?? tx.hash,
    amount: Number(ethers.formatUnits(tokenBalance, config.decimals)),
    to: adminAddress,
  };
}

function createTronWeb(privateKeyHex: string) {
  return new TronWeb({
    fullHost: "https://api.trongrid.io",
    headers: process.env.TRONGRID_API_KEY
      ? { "TRON-PRO-API-KEY": process.env.TRONGRID_API_KEY }
      : {},
    privateKey: privateKeyHex,
  });
}

async function fundTronGas(toAddress: string) {
  const adminPk = getTronWallet(ADMIN_WALLET_INDEX).privateKey.slice(2);
  const tronWeb = createTronWeb(adminPk);
  const amountSun = 15_000_000; // 15 TRX
  const fromAddress = tronWeb.defaultAddress.base58;
  if (!fromAddress || typeof fromAddress !== "string") {
    throw new Error("Admin TRON address not configured");
  }

  const tx = await tronWeb.transactionBuilder.sendTrx(toAddress, amountSun, fromAddress);
  const signed = await tronWeb.trx.sign(tx);
  const result = await tronWeb.trx.sendRawTransaction(signed);
  if (!result.result) throw new Error("Failed to fund TRX for sweep");
  return result.txid as string;
}

async function sweepTron(walletIndex: number) {
  if (walletIndex === ADMIN_WALLET_INDEX) return null;

  const privateKey = getTronWallet(walletIndex).privateKey.slice(2);
  const tronWeb = createTronWeb(privateKey);
  const sourceAddress = generateTronDepositAddress(walletIndex);
  const adminAddress = getSweepDestination("TRC20");

  const tronWebRead = createTronWeb(privateKey);
  const contract = await tronWebRead.contract().at(USDT.TRC20.contract);
  const rawBalance = await contract.balanceOf(sourceAddress).call();
  const balance = BigInt(rawBalance.toString());
  if (balance === BigInt(0)) return null;

  const trxBalance = await tronWeb.trx.getBalance(sourceAddress);
  if (trxBalance < 10_000_000 && isGasFundingEnabled()) {
    await fundTronGas(sourceAddress);
  } else if (trxBalance < 5_000_000) {
    throw new Error("No TRX on sub-address for TRC20 sweep");
  }

  const txId = await contract.transfer(adminAddress, balance.toString()).send({
    feeLimit: 100_000_000,
  });

  return {
    txHash: txId,
    amount: Number(balance) / Math.pow(10, USDT.TRC20.decimals),
    to: adminAddress,
  };
}

function getSweepDestination(network: "ERC20" | "BEP20" | "TRC20") {
  const custom = getConfiguredTreasuryAddresses();
  if (custom) return custom[network];
  return network === "TRC20"
    ? generateTronDepositAddress(ADMIN_WALLET_INDEX)
    : generateDepositAddress(ADMIN_WALLET_INDEX);
}

export async function sweepUsdtToAdmin(network: string, walletIndex: number) {
  if (!isAutoSweepEnabled()) return null;
  if (usesCustomPlatformWallet()) return null;
  if (!process.env.MASTER_WALLET_MNEMONIC) {
    throw new Error("MASTER_WALLET_MNEMONIC not configured");
  }

  if (network === "ERC20" || network === "BEP20") {
    return sweepEvm(network, walletIndex);
  }
  if (network === "TRC20") {
    return sweepTron(walletIndex);
  }
  throw new Error(`Unsupported network: ${network}`);
}

export async function getAdminWalletStatus() {
  const addresses = getAdminAddresses();
  const status: Record<string, unknown> = {
    walletIndex: addresses.walletIndex,
    source: addresses.source,
    addresses: {
      ERC20: addresses.ERC20,
      BEP20: addresses.BEP20,
      TRC20: addresses.TRC20,
      source: addresses.source,
    },
    autoSweepEnabled: isAutoSweepEnabled() && !usesCustomPlatformWallet(),
    gasFundingEnabled: isGasFundingEnabled(),
    usdtBalances: {} as Record<string, number>,
    nativeBalances: {} as Record<string, number>,
  };

  const custom = getConfiguredTreasuryAddresses();
  if (!custom && !process.env.MASTER_WALLET_MNEMONIC) {
    return { ...status, configured: false };
  }

  try {
    const ethProvider = new ethers.JsonRpcProvider(USDT.ERC20.rpc);
    const bscProvider = new ethers.JsonRpcProvider(USDT.BEP20.rpc);

    const [erc20, bep20] = await Promise.all([
      getEvmUsdtBalance("ERC20", addresses.ERC20),
      getEvmUsdtBalance("BEP20", addresses.BEP20),
    ]);

    const ethNative = await ethProvider.getBalance(addresses.ERC20);
    const bnbNative = await bscProvider.getBalance(addresses.BEP20);

    (status.usdtBalances as Record<string, number>).ERC20 = erc20.formatted;
    (status.usdtBalances as Record<string, number>).BEP20 = bep20.formatted;
    (status.nativeBalances as Record<string, number>).ETH = Number(ethers.formatEther(ethNative));
    (status.nativeBalances as Record<string, number>).BNB = Number(ethers.formatEther(bnbNative));

    const tronWeb = createTronWeb(getEvmWallet(ADMIN_WALLET_INDEX).privateKey.slice(2));
    const tronContract = await tronWeb.contract().at(USDT.TRC20.contract);
    const trcBal = await tronContract.balanceOf(addresses.TRC20).call();
    const trxNative = await tronWeb.trx.getBalance(addresses.TRC20);

    (status.usdtBalances as Record<string, number>).TRC20 =
      Number(trcBal.toString()) / Math.pow(10, USDT.TRC20.decimals);
    (status.nativeBalances as Record<string, number>).TRX = trxNative / 1_000_000;
    status.configured = true;
  } catch (error) {
    status.configured = true;
    status.balanceError = error instanceof Error ? error.message : "Failed to fetch balances";
  }

  return status;
}
