import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase/server";
import { bridgeSupabaseUser } from "@/lib/supabase/bridge";
import { createSupabaseLoginToken } from "@/lib/supabase/login-token";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? (type === "recovery" ? "/reset-password" : "/dashboard");
  const authError = searchParams.get("error_description") || searchParams.get("error");

  if (authError && !code) {
    console.error("[auth/callback] provider error:", authError);
    const dest = type === "recovery" ? "/forgot-password?error=reset_failed" : "/login?error=auth_failed";
    return NextResponse.redirect(`${origin}${dest}`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  try {
    const isRecovery = type === "recovery";
    let callbackResponse = NextResponse.redirect(
      `${origin}${isRecovery ? "/reset-password" : `/auth/complete?next=${encodeURIComponent(next)}`}`
    );
    const supabase = createRouteHandlerClient(request, callbackResponse);
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.user?.email) {
      console.error("[auth/callback] exchange failed:", error?.message);
      const dest = isRecovery ? "/forgot-password?error=reset_expired" : "/login?error=auth_failed";
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

    const loginToken = createSupabaseLoginToken(data.user.email);
    const finalRedirect = NextResponse.redirect(
      `${origin}/auth/complete?token=${encodeURIComponent(loginToken)}&next=${encodeURIComponent(next)}`
    );
    callbackResponse.cookies.getAll().forEach(({ name, value }) => {
      finalRedirect.cookies.set(name, value);
    });
    return finalRedirect;
  } catch (err) {
    console.error("[auth/callback] failed:", err);
    return NextResponse.redirect(`${origin}/login?error=account_setup_failed`);
  }
}
