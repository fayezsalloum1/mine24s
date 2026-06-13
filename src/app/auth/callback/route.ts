import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { bridgeSupabaseUser } from "@/lib/supabase/bridge";
import { createSupabaseLoginToken } from "@/lib/supabase/login-token";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user?.email) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  try {
    await bridgeSupabaseUser({
      supabaseUserId: data.user.id,
      email: data.user.email,
      fullName:
        (data.user.user_metadata?.full_name as string | undefined) ?? null,
    });
  } catch (err) {
    console.error("[auth/callback] bridge failed:", err);
    return NextResponse.redirect(`${origin}/login?error=account_setup_failed`);
  }

  const loginToken = createSupabaseLoginToken(data.user.email);
  return NextResponse.redirect(
    `${origin}/auth/complete?token=${encodeURIComponent(loginToken)}&next=${encodeURIComponent(next)}`
  );
}
