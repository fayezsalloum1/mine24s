import bcrypt from "bcryptjs";
import { prisma } from "./lib/prisma";

async function main() {
  const hash = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@yourdomain.com" },
    update: { password: hash, role: "ADMIN", emailVerified: true },
    create: {
      email: "admin@yourdomain.com",
      password: hash,
      role: "ADMIN",
      walletIndex: 0,
      depositAddress: "ADMIN_ADDRESS",
      tronDepositAddress: "ADMIN_ADDRESS",
      referralCode: "ADMIN001",
      isFrozen: false,
      emailVerified: true,
    },
  });
  console.log("Admin created:", admin.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
