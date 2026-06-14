/**
 * Delete all non-admin users and their related data. Keeps ADMIN role / ADMIN_EMAIL only.
 * Usage: node scripts/purge-test-users.mjs
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { PrismaClient } from "@prisma/client";

try {
  const envFile = readFileSync(resolve(process.cwd(), ".env"), "utf8");
  for (const line of envFile.split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
    }
  }
} catch {
  // env may already be set
}

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

  const admins = await prisma.user.findMany({
    where: {
      OR: [{ role: "ADMIN" }, ...(adminEmail ? [{ email: adminEmail }] : [])],
    },
    select: { id: true, email: true, role: true },
  });

  if (admins.length === 0) {
    console.error("No admin user found. Set ADMIN_EMAIL or ensure a user has role ADMIN.");
    process.exit(1);
  }

  const adminIds = [...new Set(admins.map((u) => u.id))];
  const testUsers = await prisma.user.findMany({
    where: { id: { notIn: adminIds } },
    select: { id: true, email: true },
  });

  if (testUsers.length === 0) {
    console.log("No test users to delete. Admin kept:");
    for (const a of admins) console.log(`  • ${a.email} (${a.role})`);
    return;
  }

  const testIds = testUsers.map((u) => u.id);
  console.log(`Keeping admin(s): ${admins.map((a) => a.email).join(", ")}`);
  console.log(`Deleting ${testUsers.length} test user(s)...`);

  await prisma.$transaction([
    prisma.notification.deleteMany({ where: { userId: { in: testIds } } }),
    prisma.processedDeposit.deleteMany({ where: { userId: { in: testIds } } }),
    prisma.poolContribution.deleteMany({ where: { userId: { in: testIds } } }),
    prisma.userPlan.deleteMany({ where: { userId: { in: testIds } } }),
    prisma.transaction.deleteMany({ where: { userId: { in: testIds } } }),
    prisma.withdrawalRequest.deleteMany({ where: { userId: { in: testIds } } }),
    prisma.user.deleteMany({ where: { id: { in: testIds } } }),
  ]);

  for (const u of testUsers) console.log(`  ✓ removed ${u.email}`);
  console.log(`\nDone. ${admins.length} admin account(s) remain.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
