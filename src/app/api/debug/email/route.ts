import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const result: Record<string, unknown> = {
    supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseAnon: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    supabaseServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    serviceRolePrefix: (process.env.SUPABASE_SERVICE_ROLE_KEY || "").slice(0, 4),
  };

  const admin = createAdminClient();
  if (!admin) {
    result.adminClient = "null";
    return NextResponse.json(result);
  }

  try {
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (error) {
      result.adminTest = "ERROR";
      result.adminError = error.message;
    } else {
      result.adminTest = "OK";
      result.userCount = data.users.length;
    }
  } catch (e) {
    result.adminTest = "EXCEPTION";
    result.adminError = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json(result);
}
