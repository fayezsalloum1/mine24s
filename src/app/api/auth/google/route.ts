import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const next = req.nextUrl.searchParams.get("next") ?? "/dashboard";
  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;

  try {
    let cookieResponse = NextResponse.next({ request: req });
    const supabase = createRouteHandlerClient(req, cookieResponse);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error || !data.url) {
      console.error("[api/auth/google] oauth error:", error?.message);
      return NextResponse.redirect(`${origin}/login?error=auth_failed`);
    }

    const googleRedirect = NextResponse.redirect(data.url);
    cookieResponse.cookies.getAll().forEach(({ name, value }) => {
      googleRedirect.cookies.set(name, value);
    });
    return googleRedirect;
  } catch (err) {
    console.error("[api/auth/google]", err);
    const code =
      err instanceof Error && err.message.includes("not configured")
        ? "supabase_not_configured"
        : "auth_failed";
    return NextResponse.redirect(`${origin}/login?error=${code}`);
  }
}
