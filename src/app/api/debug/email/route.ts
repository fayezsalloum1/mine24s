import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const result: Record<string, unknown> = {
    serviceRolePrefix: (process.env.SUPABASE_SERVICE_ROLE_KEY || "").slice(0, 4),
  };
  const admin = createAdminClient();
  if (!admin) {
    result.adminClient = "null";
    return NextResponse.json(result);
  }
  try {
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });
    result.adminTest = error ? "ERROR" : "OK";
    if (error) result.adminError = error.message;
    else result.userCount = data.users.length;
  } catch (e) {
    result.adminTest = "EXCEPTION";
    result.adminError = e instanceof Error ? e.message : String(e);
  }
  return NextResponse.json(result);
}
