import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/config";

function readConfig() {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) {
    throw new Error("Supabase env vars are not configured");
  }
  return { url, anonKey };
}

export async function createClient() {
  const { url, anonKey } = readConfig();
  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // called from a Server Component — safe to ignore
        }
      },
    },
  });
}

export function createRouteHandlerClient(
  request: NextRequest,
  response: NextResponse
) {
  const { url, anonKey } = readConfig();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });
}

export function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach(({ name, value }) => {
    to.cookies.set(name, value);
  });
}
