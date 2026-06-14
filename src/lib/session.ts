import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { check2FAVerified } from "@/lib/otp-store";

export type AppUser = {
  id: string;
  email: string;
  role: string;
};

export async function getSupabaseAuthUser() {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user?.email) return null;
    return user;
  } catch {
    return null;
  }
}

export async function getAppUser(): Promise<{
  appUser: AppUser | null;
  requires2FA: boolean;
}> {
  const supabaseUser = await getSupabaseAuthUser();
  if (!supabaseUser?.email) {
    return { appUser: null, requires2FA: false };
  }

  const email = supabaseUser.email.trim().toLowerCase();

  let prismaUser;
  try {
    prismaUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, role: true, twoFactorEnabled: true, isFrozen: true },
    });
  } catch (err) {
    console.error("[session] prisma lookup failed:", err);
    return { appUser: null, requires2FA: false };
  }

  if (!prismaUser) {
    return { appUser: null, requires2FA: false };
  }

  const requires2FA =
    prismaUser.twoFactorEnabled && !check2FAVerified(prismaUser.id);

  if (requires2FA || prismaUser.isFrozen) {
    return {
      appUser: {
        id: prismaUser.id,
        email: prismaUser.email,
        role: prismaUser.role,
      },
      requires2FA,
    };
  }

  return {
    appUser: {
      id: prismaUser.id,
      email: prismaUser.email,
      role: prismaUser.role,
    },
    requires2FA: false,
  };
}
