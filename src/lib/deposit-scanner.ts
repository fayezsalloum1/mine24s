import { ethers } from "ethers";
import { prisma } from "@/lib/prisma";
import { USDT, SCAN_BLOCKS } from "@/lib/constants";
import { createNotification } from "@/lib/notifications";
import { sendEmail, depositConfirmedHtml } from "@/lib/email";
import { sendSMS } from "@/lib/sms";
import { sweepUsdtToAdmin } from "@/lib/sweep";
import {
  ADMIN_WALLET_INDEX,
  getConfiguredTreasuryAddresses,
  usesCustomPlatformWallet,
} from "@/lib/wallet";
import { isDepositScannerDisabled } from "@/lib/runtime-env";

const ERC20_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
];

async function creditDeposit(
  userId: string,
  walletIndex: number,
  network: string,
  txHash: string,
  amount: number,
  userEmail: string,
  phoneNumber: string | null,
  phoneVerified: boolean
) {
  const existing = await prisma.processedDeposit.findUnique({
    where: { network_txHash: { network, txHash } },
  });
  if (existing) return false;

  await prisma.$transaction([
    prisma.processedDeposit.create({
      data: { userId, network, txHash, amount },
    }),
    prisma.transaction.create({
      data: {
        userId,
        type: "DEPOSIT",
        amount,
        status: "CONFIRMED",
        network,
        txHash,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { balance: { increment: amount } },
    }),
  ]);

  const message = `Deposit of $${amount.toFixed(2)} (${network}) confirmed automatically!`;
  await createNotification(userId, message);
  await sendEmail(userEmail, "Deposit Confirmed", depositConfirmedHtml(amount));
  if (phoneNumber && phoneVerified) {
    await sendSMS(phoneNumber, message);
  }

  if (walletIndex !== ADMIN_WALLET_INDEX) {
    try {
      const sweep = await sweepUsdtToAdmin(network, walletIndex);
      if (sweep?.txHash) {
        await prisma.processedDeposit.update({
          where: { network_txHash: { network, txHash } },
          data: { sweepTxHash: sweep.txHash },
        });
        console.log(`[DepositScanner] Swept ${sweep.amount} USDT (${network}) to admin — ${sweep.txHash}`);
      }
    } catch (sweepError) {
      const sweepMessage = sweepError instanceof Error ? sweepError.message : "Sweep failed";
      await prisma.processedDeposit.update({
        where: { network_txHash: { network, txHash } },
        data: { sweepError: sweepMessage },
      });
      console.error(`[DepositScanner] Sweep failed (${network}, index ${walletIndex}):`, sweepMessage);
    }
  }

  return true;
}

async function scanEvmNetwork(
  network: "ERC20" | "BEP20",
  users: Array<{ id: string; walletIndex: number; depositAddress: string; email: string; phoneNumber: string | null; phoneVerified: boolean }>
) {
  const config = USDT[network];
  const provider = new ethers.JsonRpcProvider(config.rpc);
  const usdt = new ethers.Contract(config.contract, ERC20_ABI, provider);
  const currentBlock = await provider.getBlockNumber();

  let state = await prisma.scannerState.findUnique({ where: { id: "main" } });
  if (!state) {
    state = await prisma.scannerState.create({ data: { id: "main" } });
  }

  const lastBlock =
    network === "ERC20"
      ? state.ethLastBlock || Math.max(0, currentBlock - SCAN_BLOCKS)
      : state.bscLastBlock || Math.max(0, currentBlock - SCAN_BLOCKS);

  const fromBlock = Math.max(lastBlock + 1, currentBlock - SCAN_BLOCKS);
  let credited = 0;

  for (const user of users) {
    try {
      const filter = usdt.filters.Transfer(null, user.depositAddress);
      const events = await usdt.queryFilter(filter, fromBlock, currentBlock);

      for (const event of events) {
        if (!("args" in event) || !event.args) continue;
        const rawAmount = Number(ethers.formatUnits(event.args[2], config.decimals));
        if (rawAmount <= 0) continue;

        const txHash = event.transactionHash;
        const ok = await creditDeposit(
          user.id,
          user.walletIndex,
          network,
          txHash,
          rawAmount,
          user.email,
          user.phoneNumber,
          user.phoneVerified
        );
        if (ok) credited++;
      }
    } catch (err) {
      console.error(`[DepositScanner] ${network} scan error for ${user.depositAddress}:`, err);
    }
  }

  if (network === "ERC20") {
    await prisma.scannerState.update({
      where: { id: "main" },
      data: { ethLastBlock: currentBlock },
    });
  } else {
    await prisma.scannerState.update({
      where: { id: "main" },
      data: { bscLastBlock: currentBlock },
    });
  }

  return credited;
}

async function scanTron(
  users: Array<{ id: string; walletIndex: number; tronDepositAddress: string; email: string; phoneNumber: string | null; phoneVerified: boolean }>
) {
  let credited = 0;

  for (const user of users) {
    try {
      const url = `https://api.trongrid.io/v1/accounts/${user.tronDepositAddress}/transactions/trc20?only_to=true&limit=20&contract_address=${USDT.TRC20.contract}`;
      const res = await fetch(url, {
        headers: process.env.TRONGRID_API_KEY
          ? { "TRON-PRO-API-KEY": process.env.TRONGRID_API_KEY }
          : {},
      });
      const data = await res.json();

      if (!data?.data) continue;

      for (const tx of data.data) {
        if (tx.token_info?.symbol !== "USDT" && tx.token_info?.address !== USDT.TRC20.contract) continue;
        const rawAmount = Number(tx.value) / Math.pow(10, USDT.TRC20.decimals);
        if (rawAmount <= 0) continue;

        const ok = await creditDeposit(
          user.id,
          user.walletIndex,
          "TRC20",
          tx.transaction_id,
          rawAmount,
          user.email,
          user.phoneNumber,
          user.phoneVerified
        );
        if (ok) credited++;
      }
    } catch (err) {
      console.error(`[DepositScanner] TRC20 scan error for ${user.tronDepositAddress}:`, err);
    }
  }

  return credited;
}

async function confirmPendingDepositByTx(
  network: string,
  txHash: string,
  amount: number
) {
  const pending = await prisma.transaction.findFirst({
    where: {
      type: "DEPOSIT",
      status: "PENDING",
      txHash,
      network,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          phoneNumber: true,
          phoneVerified: true,
        },
      },
    },
  });

  if (!pending || Math.abs(pending.amount - amount) > 0.01) return false;

  const existing = await prisma.processedDeposit.findUnique({
    where: { network_txHash: { network, txHash } },
  });
  if (existing) return false;

  await prisma.$transaction([
    prisma.processedDeposit.create({
      data: { userId: pending.userId, network, txHash, amount },
    }),
    prisma.transaction.update({
      where: { id: pending.id },
      data: { status: "CONFIRMED", amount },
    }),
    prisma.user.update({
      where: { id: pending.userId },
      data: { balance: { increment: amount } },
    }),
  ]);

  const message = `Deposit of $${amount.toFixed(2)} (${network}) confirmed!`;
  await createNotification(pending.userId, message);
  await sendEmail(pending.user.email, "Deposit Confirmed", depositConfirmedHtml(amount));
  if (pending.user.phoneNumber && pending.user.phoneVerified) {
    await sendSMS(pending.user.phoneNumber, message);
  }

  return true;
}

async function scanCustomTreasuryNetwork(network: "ERC20" | "BEP20") {
  const treasury = getConfiguredTreasuryAddresses();
  if (!treasury) return 0;

  const config = USDT[network];
  const provider = new ethers.JsonRpcProvider(config.rpc);
  const usdt = new ethers.Contract(config.contract, ERC20_ABI, provider);
  const currentBlock = await provider.getBlockNumber();

  let state = await prisma.scannerState.findUnique({ where: { id: "main" } });
  if (!state) {
    state = await prisma.scannerState.create({ data: { id: "main" } });
  }

  const lastBlock =
    network === "ERC20"
      ? state.ethLastBlock || Math.max(0, currentBlock - SCAN_BLOCKS)
      : state.bscLastBlock || Math.max(0, currentBlock - SCAN_BLOCKS);

  const fromBlock = Math.max(lastBlock + 1, currentBlock - SCAN_BLOCKS);
  let credited = 0;
  const targetAddress = treasury[network];

  try {
    const filter = usdt.filters.Transfer(null, targetAddress);
    const events = await usdt.queryFilter(filter, fromBlock, currentBlock);

    for (const event of events) {
      if (!("args" in event) || !event.args) continue;
      const rawAmount = Number(ethers.formatUnits(event.args[2], config.decimals));
      if (rawAmount <= 0) continue;

      const txHash = event.transactionHash;
      const ok = await confirmPendingDepositByTx(network, txHash, rawAmount);
      if (ok) credited++;
    }
  } catch (err) {
    console.error(`[DepositScanner] Custom ${network} scan error:`, err);
  }

  if (network === "ERC20") {
    await prisma.scannerState.update({
      where: { id: "main" },
      data: { ethLastBlock: currentBlock },
    });
  } else {
    await prisma.scannerState.update({
      where: { id: "main" },
      data: { bscLastBlock: currentBlock },
    });
  }

  return credited;
}

async function scanCustomTreasuryTron() {
  const treasury = getConfiguredTreasuryAddresses();
  if (!treasury) return 0;

  let credited = 0;

  try {
    const url = `https://api.trongrid.io/v1/accounts/${treasury.TRC20}/transactions/trc20?only_to=true&limit=20&contract_address=${USDT.TRC20.contract}`;
    const res = await fetch(url, {
      headers: process.env.TRONGRID_API_KEY
        ? { "TRON-PRO-API-KEY": process.env.TRONGRID_API_KEY }
        : {},
    });
    const data = await res.json();
    if (!data?.data) return 0;

    for (const tx of data.data) {
      if (tx.token_info?.symbol !== "USDT" && tx.token_info?.address !== USDT.TRC20.contract) continue;
      const rawAmount = Number(tx.value) / Math.pow(10, USDT.TRC20.decimals);
      if (rawAmount <= 0) continue;

      const ok = await confirmPendingDepositByTx("TRC20", tx.transaction_id, rawAmount);
      if (ok) credited++;
    }
  } catch (err) {
    console.error("[DepositScanner] Custom TRC20 scan error:", err);
  }

  return credited;
}

async function scanCustomPlatformDeposits() {
  const [erc20, bep20, trc20] = await Promise.all([
    scanCustomTreasuryNetwork("ERC20"),
    scanCustomTreasuryNetwork("BEP20"),
    scanCustomTreasuryTron(),
  ]);
  return { credited: erc20 + bep20 + trc20, erc20, bep20, trc20 };
}

export async function scanDeposits() {
  if (usesCustomPlatformWallet()) {
    if (!getConfiguredTreasuryAddresses()) {
      console.warn("[DepositScanner] Custom wallet mode but treasury addresses not set");
      return { credited: 0, error: "Treasury not configured" };
    }
    return scanCustomPlatformDeposits();
  }

  if (!process.env.MASTER_WALLET_MNEMONIC) {
    console.warn("[DepositScanner] MASTER_WALLET_MNEMONIC not set, skipping scan");
    return { credited: 0, error: "No mnemonic configured" };
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      walletIndex: true,
      email: true,
      depositAddress: true,
      tronDepositAddress: true,
      phoneNumber: true,
      phoneVerified: true,
    },
  });

  if (users.length === 0) return { credited: 0 };

  const evmUsers = users.map((u) => ({
    id: u.id,
    walletIndex: u.walletIndex,
    depositAddress: u.depositAddress,
    email: u.email,
    phoneNumber: u.phoneNumber,
    phoneVerified: u.phoneVerified,
  }));

  const tronUsers = users.map((u) => ({
    id: u.id,
    walletIndex: u.walletIndex,
    tronDepositAddress: u.tronDepositAddress,
    email: u.email,
    phoneNumber: u.phoneNumber,
    phoneVerified: u.phoneVerified,
  }));

  const [erc20, bep20, trc20] = await Promise.all([
    scanEvmNetwork("ERC20", evmUsers),
    scanEvmNetwork("BEP20", evmUsers),
    scanTron(tronUsers),
  ]);

  const credited = erc20 + bep20 + trc20;
  if (credited > 0) {
    console.log(`[DepositScanner] Credited ${credited} deposit(s)`);
  }

  return { credited, erc20, bep20, trc20 };
}

let scannerInterval: ReturnType<typeof setInterval> | null = null;

export function startDepositScanner() {
  if (scannerInterval) return;
  if (isDepositScannerDisabled()) return;

  const intervalMs = Number(process.env.DEPOSIT_SCAN_INTERVAL_MS || 120000);

  scanDeposits().catch(console.error);
  scannerInterval = setInterval(() => {
    scanDeposits().catch(console.error);
  }, intervalMs);

  console.log(`[DepositScanner] Started (every ${intervalMs / 1000}s)`);
}
// trigger
