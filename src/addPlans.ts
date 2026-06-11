import { prisma } from "./lib/prisma";

const soloPlans = [
  {
    name: "Starter",
    description: "Perfect for beginners. Includes 1x Antminer S19 with 95 TH/s hashrate.",
    price: 100,
    dailyReturnPercent: 1,
    durationDays: 100,
    machineImage: "/machines/starter.png",
    planType: "SOLO" as const,
  },
  {
    name: "Basic",
    description: "Great value. Includes 1x Antminer S19 Pro with 110 TH/s hashrate.",
    price: 500,
    dailyReturnPercent: 1.5,
    durationDays: 100,
    machineImage: "/machines/basic.png",
    planType: "SOLO" as const,
  },
  {
    name: "Pro",
    description: "Professional grade. Includes 1x Antminer S19 XP with 140 TH/s hashrate.",
    price: 1000,
    dailyReturnPercent: 2,
    durationDays: 100,
    machineImage: "/machines/pro.png",
    planType: "SOLO" as const,
  },
  {
    name: "Elite",
    description: "High performance. Includes 5x Antminer S19 XP with 700 TH/s total hashrate.",
    price: 5000,
    dailyReturnPercent: 2.5,
    durationDays: 100,
    machineImage: "/machines/elite.png",
    planType: "SOLO" as const,
  },
  {
    name: "Ultimate",
    description: "Maximum power. Includes 10x Antminer S19 XP with 1400 TH/s total hashrate.",
    price: 10000,
    dailyReturnPercent: 3,
    durationDays: 100,
    machineImage: "/machines/ultimate.png",
    planType: "SOLO" as const,
  },
];

const pooledPlans = [
  {
    name: "Community Pool 50K",
    description:
      "Join miners worldwide to unlock a $50,000 shared mining pool. Profit is distributed daily based on your contribution share once the pool is fully funded.",
    price: 50000,
    dailyReturnPercent: 2,
    durationDays: 100,
    machineImage: "/machines/elite.png",
    planType: "POOLED" as const,
    targetPoolAmount: 50000,
    minContribution: 500,
    maxParticipants: 100,
  },
];

async function main() {
  for (const plan of [...soloPlans, ...pooledPlans]) {
    const existing = await prisma.plan.findFirst({ where: { name: plan.name } });
    if (existing) {
      console.log(`Skipped (already exists): ${plan.name}`);
      continue;
    }

    await prisma.plan.create({ data: plan });
    console.log(`Created plan: ${plan.name} (${plan.planType})`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
