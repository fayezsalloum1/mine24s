import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";

async function findSupabaseUserIdByEmail(email: string) {
  const admin = createAdminClient();
  if (!admin) return null;

  let page = 1;
  const perPage = 200;

  while (page <= 10) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      console.error("[provision-auth-user] listUsers:", error.message);
      return null;
    }

    const match = data.users.find(
      (user) => user.email?.trim().toLowerCase() === email
    );
    if (match?.id) return match.id;

    if (data.users.length < perPage) break;
    page += 1;
  }

  return null;
}

/** Ensure a Prisma user has a linked Supabase Auth account (for reset / OAuth). */
export async function ensureSupabaseAuthUser(email: string, password?: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const prismaUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, supabaseUserId: true },
  });

  if (!prismaUser) return { linked: false as const, reason: "no_prisma_user" as const };

  if (prismaUser.supabaseUserId) {
    return { linked: true as const, supabaseUserId: prismaUser.supabaseUserId };
  }

  const admin = createAdminClient();
  if (!admin) {
    return { linked: false as const, reason: "no_service_role" as const };
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: normalizedEmail,
    email_confirm: true,
    ...(password && password.length >= 8 ? { password } : {}),
  });

  let supabaseUserId = created.user?.id ?? null;

  if (!supabaseUserId && createError) {
    const msg = createError.message.toLowerCase();
    if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
      supabaseUserId = await findSupabaseUserIdByEmail(normalizedEmail);
    } else {
      console.error("[provision-auth-user] createUser:", createError.message);
      return { linked: false as const, reason: "create_failed" as const };
    }
  }

  if (!supabaseUserId) {
    return { linked: false as const, reason: "not_found" as const };
  }

  await prisma.user.update({
    where: { id: prismaUser.id },
    data: { supabaseUserId, emailVerified: true },
  });

  return { linked: true as const, supabaseUserId };
}
