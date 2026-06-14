import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { getSupabaseConfig, isSupabaseConfigured } from "@/lib/supabase/config";
import { ensureSupabaseAuthUser } from "@/lib/supabase/provision-auth-user";

const GENERIC_SUCCESS =
  "If an account exists with that email, you will receive a password reset link from Supabase shortly. Check your inbox and spam folder.";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: "Password reset is not configured. Set SUPABASE_PUBLIC in your environment.",
        },
        { status: 503 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const prismaUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (!prismaUser) {
      return NextResponse.json({ success: true, message: GENERIC_SUCCESS });
    }

    const provision = await ensureSupabaseAuthUser(normalizedEmail);
    if (!provision.linked) {
      console.error("[forgot-password] could not link Supabase user:", provision.reason);
      return NextResponse.json(
        {
          success: false,
          error:
            provision.reason === "no_service_role"
              ? "Password reset requires SUPABASE_SERVICE_ROLE_KEY on the server. Add it in Vercel and redeploy."
              : "Could not prepare your account for password reset. Please contact support.",
        },
        { status: 503 }
      );
    }

    const { url, anonKey } = getSupabaseConfig();
    const baseUrl = (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");
    const redirectTo = `${baseUrl}/auth/callback?type=recovery&next=/reset-password`;

    const supabase = createClient(url, anonKey);
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo,
    });

    if (error) {
      console.error("[forgot-password] supabase reset:", error.message);
      return NextResponse.json(
        {
          success: false,
          error:
            "Could not send reset email. Confirm Supabase Auth email is enabled (Authentication → Email) and redirect URLs include /auth/callback.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, message: GENERIC_SUCCESS });
  } catch (err) {
    console.error("[forgot-password]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
