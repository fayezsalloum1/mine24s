import { prisma } from "./lib/prisma";
import bcrypt from "bcryptjs";
import {
  generateDepositAddress,
  generateTronDepositAddress,
  getConfiguredTreasuryAddresses,
  getPlatformDepositAddresses,
  usesCustomPlatformWallet,
} from "./lib/wallet";
import { generateSolanaDepositAddress } from "./lib/solana-wallet";

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required to seed an admin user");
  }

  const password = await bcrypt.hash(adminPassword, 10);

  const walletIndex = 0;
  let depositAddress: string;
  let tronDepositAddress: string;
  let solanaDepositAddress: string;

  if (usesCustomPlatformWallet()) {
    if (!getConfiguredTreasuryAddresses()) {
      throw new Error("USE_CUSTOM_PLATFORM_WALLET=true requires ADMIN_TREASURY_EVM and ADMIN_TREASURY_TRC20");
    }
    const platform = getPlatformDepositAddresses();
    depositAddress = platform.depositAddress;
    tronDepositAddress = platform.tronDepositAddress;
    solanaDepositAddress = platform.solanaDepositAddress;
  } else {
    depositAddress = generateDepositAddress(0);
    tronDepositAddress = generateTronDepositAddress(0);
    solanaDepositAddress = generateSolanaDepositAddress(0);
  }

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      depositAddress,
      tronDepositAddress,
      solanaDepositAddress,
      emailVerified: true,
    },
    create: {
      email: adminEmail,
      password,
      role: "ADMIN",
      walletIndex,
      depositAddress,
      tronDepositAddress,
      solanaDepositAddress,
      referralCode: "ADMIN001",
      emailVerified: true,
    },
  });

  console.log("Admin created:", admin.email);
  console.log("Deposit ERC20/BEP20:", depositAddress);
  console.log("Deposit TRC20:", tronDepositAddress);
  console.log("Deposit SOL:", solanaDepositAddress);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
