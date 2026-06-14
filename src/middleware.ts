import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function readSupabaseConfig() {
  const combined = process.env.SUPABASE_PUBLIC?.trim();
  if (combined) {
    const [url = "", anonKey = ""] = combined.split("|").map((part) => part.trim());
    if (url && anonKey) return { url, anonKey };
  }
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim() ||
    "";
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim() ||
    "";
  return { url, anonKey };
}

export async function middleware(request: NextRequest) {
  const { url, anonKey } = readSupabaseConfig();
  if (!url || !anonKey) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  try {
    await supabase.auth.getUser();
  } catch (err) {
    console.error("[middleware] supabase auth failed:", err);
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm)$).*)",
  ],
};
