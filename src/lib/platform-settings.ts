import { prisma } from "@/lib/prisma";

export type PlatformSettingsData = {
  requireReferralForWithdrawal: boolean;
};

const DEFAULTS: PlatformSettingsData = {
  requireReferralForWithdrawal: true,
};

export async function getPlatformSettings(): Promise<PlatformSettingsData> {
  const row = await prisma.platformSettings.upsert({
    where: { id: "main" },
    create: { id: "main", ...DEFAULTS },
    update: {},
    select: { requireReferralForWithdrawal: true },
  });
  return row;
}

export async function updatePlatformSettings(data: Partial<PlatformSettingsData>) {
  return prisma.platformSettings.upsert({
    where: { id: "main" },
    create: { id: "main", ...DEFAULTS, ...data },
    update: data,
    select: { requireReferralForWithdrawal: true, updatedAt: true },
  });
}
