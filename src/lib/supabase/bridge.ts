import { prisma } from "@/lib/prisma";
import { assignWalletForNewUser } from "@/lib/wallet";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";

export async function bridgeSupabaseUser(params: {
  supabaseUserId: string;
  email: string;
  fullName?: string | null;
}) {
  const email = params.email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const shouldBeAdmin = Boolean(adminEmail && email === adminEmail);

    if (
      existing.supabaseUserId !== params.supabaseUserId ||
      (shouldBeAdmin && existing.role !== "ADMIN")
    ) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          supabaseUserId: params.supabaseUserId,
          emailVerified: true,
          ...(shouldBeAdmin ? { role: "ADMIN" } : {}),
        },
      });
      return prisma.user.findUniqueOrThrow({ where: { id: existing.id } });
    }
    return existing;
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const isAdmin = Boolean(adminEmail && email === adminEmail);

  const { walletIndex, depositAddress, tronDepositAddress } =
    await assignWalletForNewUser(prisma);
  const referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();
  const unusablePassword = await bcrypt.hash(
    "supabase:" + randomBytes(24).toString("hex"),
    10
  );

  return prisma.user.create({
    data: {
      email,
      password: unusablePassword,
      fullName: params.fullName?.trim() || email.split("@")[0],
      walletIndex,
      depositAddress,
      tronDepositAddress,
      referralCode,
      emailVerified: true,
      supabaseUserId: params.supabaseUserId,
      role: isAdmin ? "ADMIN" : "USER",
    },
  });
}
