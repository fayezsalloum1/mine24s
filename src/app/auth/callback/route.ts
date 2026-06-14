import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase/server";
import { bridgeSupabaseUser } from "@/lib/supabase/bridge";
import { WalletConfigError } from "@/lib/wallet";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

function mapAuthErrorCode(message: string) {
  const msg = message.toLowerCase();
  if (msg.includes("access_denied") || msg.includes("testing") || msg.includes("test user")) {
    return "google_access_denied";
  }
  if (msg.includes("signup") || msg.includes("sign up") || msg.includes("not allowed")) {
    return "signup_disabled";
  }
  return "auth_failed";
}

function mapSetupError(err: unknown) {
  if (err instanceof WalletConfigError) return "wallet_not_configured";
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2022") {
    return "db_migration_required";
  }
  const message = err instanceof Error ? err.message.toLowerCase() : "";
  if (message.includes("migrate") || message.includes("does not exist")) {
    return "db_migration_required";
  }
  return "account_setup_failed";
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? (type === "recovery" ? "/reset-password" : "/dashboard");
  const authError = searchParams.get("error_description") || searchParams.get("error");

  if (authError && !code) {
    console.error("[auth/callback] provider error:", authError);
    const errorCode = mapAuthErrorCode(authError);
    const dest =
      type === "recovery"
        ? "/forgot-password?error=reset_failed"
        : `/login?error=${errorCode}`;
    return NextResponse.redirect(`${origin}${dest}`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  try {
    const isRecovery = type === "recovery";
    let callbackResponse = NextResponse.redirect(
      `${origin}${isRecovery ? "/reset-password" : next}`
    );
    const supabase = createRouteHandlerClient(request, callbackResponse);
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.user?.email) {
      console.error("[auth/callback] exchange failed:", error?.message);
      const errorCode = error?.message ? mapAuthErrorCode(error.message) : "auth_failed";
      const dest = isRecovery
        ? "/forgot-password?error=reset_expired"
        : `/login?error=${errorCode}`;
      return NextResponse.redirect(`${origin}${dest}`);
    }

    if (isRecovery) {
      const recoveryRedirect = NextResponse.redirect(`${origin}/reset-password`);
      callbackResponse.cookies.getAll().forEach(({ name, value }) => {
        recoveryRedirect.cookies.set(name, value);
      });
      return recoveryRedirect;
    }

    await bridgeSupabaseUser({
      supabaseUserId: data.user.id,
      email: data.user.email,
      fullName: (data.user.user_metadata?.full_name as string | undefined) ?? null,
    });

    const destination = next.startsWith("/") ? next : "/dashboard";
    const finalRedirect = NextResponse.redirect(`${origin}${destination}`);
    callbackResponse.cookies.getAll().forEach(({ name, value }) => {
      finalRedirect.cookies.set(name, value);
    });

    return finalRedirect;
  } catch (err) {
    console.error("[auth/callback] failed:", err);
    const errorCode = mapSetupError(err);
    return NextResponse.redirect(`${origin}/login?error=${errorCode}`);
  }
}
