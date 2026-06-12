/**
 * Verify HD sub-addresses, admin collection wallet, and sweep config.
 * Does NOT print mnemonic or private keys.
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { PrismaClient } from "@prisma/client";
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
  /* env optional */
}

const EVM_PATH = "m/44'/60'/0'/0";
const TRON_PATH = "m/44'/195'/0'/0";
const ADMIN_INDEX = Number(process.env.ADMIN_WALLET_INDEX ?? 0);

function deriveEvm(mnemonic, index) {
  return ethers.HDNodeWallet.fromPhrase(mnemonic, undefined, `${EVM_PATH}/${index}`).address;
}

function deriveTron(mnemonic, index) {
  const pk = ethers.HDNodeWallet.fromPhrase(mnemonic, undefined, `${TRON_PATH}/${index}`).privateKey.slice(2);
  return fromPrivateKey(pk);
}

const mnemonic = process.env.MASTER_WALLET_MNEMONIC?.trim();
const useCustom = process.env.USE_CUSTOM_PLATFORM_WALLET === "true";

console.log("\n=== Wallet system verification ===\n");

console.log("Config:");
console.log("  USE_CUSTOM_PLATFORM_WALLET:", useCustom);
console.log("  ADMIN_WALLET_INDEX:", ADMIN_INDEX);
console.log("  AUTO_SWEEP_DEPOSITS:", process.env.AUTO_SWEEP_DEPOSITS !== "false");
console.log("  SWEEP_FUND_GAS:", process.env.SWEEP_FUND_GAS !== "false");
console.log("  DISABLE_DEPOSIT_SCANNER:", process.env.DISABLE_DEPOSIT_SCANNER === "true");
console.log("  MASTER_WALLET_MNEMONIC:", mnemonic ? "set (" + mnemonic.split(/\s+/).length + " words)" : "MISSING");
console.log("  TRONGRID_API_KEY:", process.env.TRONGRID_API_KEY?.trim() ? "set" : "missing (TRC20 scans may rate-limit)");

if (useCustom) {
  console.error("\n❌ HD mode required — set USE_CUSTOM_PLATFORM_WALLET=false");
  process.exit(1);
}
if (!mnemonic) {
  console.error("\n❌ MASTER_WALLET_MNEMONIC not set");
  process.exit(1);
}

const adminEvm = deriveEvm(mnemonic, ADMIN_INDEX);
const adminTron = deriveTron(mnemonic, ADMIN_INDEX);
console.log("\nAdmin collection wallet (index", ADMIN_INDEX + "):");
console.log("  ERC20/BEP20:", adminEvm);
console.log("  TRC20:       ", adminTron);

const prisma = new PrismaClient();
const users = await prisma.user.findMany({
  select: {
    email: true,
    role: true,
    walletIndex: true,
    depositAddress: true,
    tronDepositAddress: true,
  },
  orderBy: { walletIndex: "asc" },
});

console.log("\nUsers (" + users.length + "):");
let issues = 0;

for (const u of users) {
  const expectedEvm = deriveEvm(mnemonic, u.walletIndex);
  const expectedTron = deriveTron(mnemonic, u.walletIndex);
  const evmOk = u.depositAddress?.toLowerCase() === expectedEvm.toLowerCase();
  const tronOk = u.tronDepositAddress === expectedTron;
  const indexOk = u.role === "ADMIN" ? u.walletIndex === ADMIN_INDEX : u.walletIndex >= 1;

  const flags = [];
  if (!evmOk) flags.push("EVM mismatch");
  if (!tronOk) flags.push("TRON mismatch");
  if (!indexOk) flags.push(u.role === "ADMIN" ? "admin not index 0" : "regular user has index 0");

  const status = flags.length ? "❌ " + flags.join(", ") : "✓";
  if (flags.length) issues++;

  console.log(`  [${u.walletIndex}] ${u.role.padEnd(5)} ${u.email}`);
  console.log(`       EVM:  ${u.depositAddress} ${evmOk ? "" : "expected " + expectedEvm}`);
  console.log(`       TRON: ${u.tronDepositAddress} ${tronOk ? "" : "expected " + expectedTron}`);
  console.log(`       ${status}`);
}

const evmSet = new Set(users.map((u) => u.depositAddress?.toLowerCase()));
const tronSet = new Set(users.map((u) => u.tronDepositAddress));
console.log("\nUniqueness:");
console.log("  Unique EVM addresses:", evmSet.size, "/", users.length, evmSet.size === users.length ? "✓" : "❌ DUPLICATE");
console.log("  Unique TRON addresses:", tronSet.size, "/", users.length, tronSet.size === users.length ? "✓" : "❌ DUPLICATE");
if (evmSet.size !== users.length || tronSet.size !== users.length) issues++;

const regularOnZero = users.filter((u) => u.role !== "ADMIN" && u.walletIndex === ADMIN_INDEX);
if (regularOnZero.length) {
  console.log("\n❌ Regular users on index 0:", regularOnZero.map((u) => u.email).join(", "));
  issues++;
} else {
  console.log("\n✓ No regular user on index 0");
}

console.log("\nSweep flow (code path):");
console.log("  1. User deposits USDT → their unique sub-address");
console.log("  2. scanDeposits() credits user.balance by matching depositAddress/tronDepositAddress");
console.log("  3. creditDeposit() calls sweepUsdtToAdmin() if walletIndex !==", ADMIN_INDEX);
console.log("  4. USDT lands on admin:", adminEvm, "(EVM) /", adminTron, "(TRON)");

console.log("\n" + (issues === 0 ? "✅ All checks passed" : "⚠️  " + issues + " issue(s) found"));
await prisma.$disconnect();
process.exit(issues ? 1 : 0);
