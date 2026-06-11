import { prisma } from "./lib/prisma";

async function main() {
  await prisma.plan.deleteMany({});
  console.log("All plans cleared");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());