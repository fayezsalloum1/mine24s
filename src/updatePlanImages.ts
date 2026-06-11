import { prisma } from "./lib/prisma";

const IMAGE_MAP: Record<string, string> = {
  Starter: "/machines/starter.png",
  Basic: "/machines/basic.png",
  Pro: "/machines/pro.png",
  Elite: "/machines/elite.png",
  Ultimate: "/machines/ultimate.png",
};

async function main() {
  for (const [name, image] of Object.entries(IMAGE_MAP)) {
    await prisma.plan.updateMany({
      where: { name },
      data: { machineImage: image },
    });
    console.log(`Updated ${name} -> ${image}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
