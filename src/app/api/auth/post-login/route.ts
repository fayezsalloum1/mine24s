import { NextResponse } from "next/server";
import { bridgeSupabaseUser } from "@/lib/supabase/bridge";
import { getSupabaseAuthUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { check2FAVerified } from "@/lib/otp-store";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabaseUser = await getSupabaseAuthUser();
  if (!supabaseUser?.email) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const email = supabaseUser.email.trim().toLowerCase();
  let prismaUser = await prisma.user.findUnique({ where: { email } });

  if (!prismaUser) {
    try {
      prismaUser = await bridgeSupabaseUser({
        supabaseUserId: supabaseUser.id,
        email,
        fullName: (supabaseUser.user_metadata?.full_name as string | undefined) ?? null,
      });
    } catch (err) {
      console.error("[post-login] bridge failed:", err);
      return NextResponse.json({ error: "Account setup failed" }, { status: 500 });
    }
  } else if (prismaUser.supabaseUserId !== supabaseUser.id) {
    await prisma.user.update({
      where: { id: prismaUser.id },
      data: { supabaseUserId: supabaseUser.id, emailVerified: true },
    });
  }

  if (prismaUser.isFrozen) {
    return NextResponse.json({ error: "Account frozen", frozen: true }, { status: 403 });
  }

  if (prismaUser.twoFactorEnabled && !check2FAVerified(prismaUser.id)) {
    return NextResponse.json({ requires2FA: true, email });
  }

  return NextResponse.json({
    success: true,
    user: { id: prismaUser.id, email: prismaUser.email, role: prismaUser.role },
  });
}
