/**
 * Creates or updates the admin user when ADMIN_EMAIL + ADMIN_PASSWORD are set.
 * Safe to run on every deploy (upsert).
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function usesCustomPlatformWallet() {
  return process.env.USE_CUSTOM_PLATFORM_WALLET === "true";
}

function getPlatformDepositAddresses() {
  const evm = process.env.ADMIN_TREASURY_EVM?.trim();
  const trc = process.env.ADMIN_TREASURY_TRC20?.trim();
  if (!evm || !trc) return null;
  return { depositAddress: evm, tronDepositAddress: trc };
}

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();

  if (!adminEmail || !adminPassword) {
    console.log("ℹ Skipping admin seed (set ADMIN_EMAIL + ADMIN_PASSWORD to create admin)");
    return;
  }

  let depositAddress;
  let tronDepositAddress;

  if (usesCustomPlatformWallet()) {
    const platform = getPlatformDepositAddresses();
    if (!platform) {
      console.error("❌ Cannot seed admin: treasury addresses missing");
      process.exit(1);
    }
    depositAddress = platform.depositAddress;
    tronDepositAddress = platform.tronDepositAddress;
  } else {
    console.log("ℹ HD wallet mode — run `npx tsx src/seed.ts` to create admin with derived addresses");
    return;
  }

  const password = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { depositAddress, tronDepositAddress, emailVerified: true, role: "ADMIN" },
    create: {
      email: adminEmail,
      password,
      role: "ADMIN",
      walletIndex: 0,
      depositAddress,
      tronDepositAddress,
      referralCode: "ADMIN001",
      emailVerified: true,
    },
  });

  console.log(`✓ Admin ready: ${admin.email}`);
}

main()
  .catch((err) => {
    console.error("❌ Admin seed failed:", err.message ?? err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
