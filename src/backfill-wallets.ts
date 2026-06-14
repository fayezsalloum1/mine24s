import { prisma } from "./lib/prisma";
import {
  generateDepositAddress,
  generateTronDepositAddress,
} from "./lib/wallet";
import { generateSolanaDepositAddress } from "./lib/solana-wallet";

async function main() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
  });

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const walletIndex = user.walletIndex ?? i;
    const depositAddress = generateDepositAddress(walletIndex);
    const tronDepositAddress = generateTronDepositAddress(walletIndex);
    const solanaDepositAddress = generateSolanaDepositAddress(walletIndex);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        walletIndex,
        depositAddress,
        tronDepositAddress,
        solanaDepositAddress,
      },
    });
    console.log(`Updated ${user.email} -> index ${walletIndex}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
