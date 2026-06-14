import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { check2FAVerified } from "@/lib/otp-store";
import { getSupabaseAuthUser } from "@/lib/session";

export async function requireAuth() {
  const supabaseUser = await getSupabaseAuthUser();
  if (!supabaseUser?.email) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const user = await prisma.user.findUnique({
    where: { email: supabaseUser.email.trim().toLowerCase() },
  });

  if (!user) {
    return { error: NextResponse.json({ error: "User not found" }, { status: 404 }) };
  }

  if (user.isFrozen) {
    return { error: NextResponse.json({ error: "Account frozen" }, { status: 403 }) };
  }

  if (user.twoFactorEnabled && !check2FAVerified(user.id)) {
    return {
      error: NextResponse.json({ error: "2FA required", requires2FA: true }, { status: 403 }),
    };
  }

  return { supabaseUser, user };
}

export async function requireAdmin() {
  const auth = await requireAuth();
  if ("error" in auth) return auth;

  if (auth.user.role !== "ADMIN") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return auth;
}
