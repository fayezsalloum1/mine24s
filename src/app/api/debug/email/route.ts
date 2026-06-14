import { NextResponse } from "next/server";
import { getEmailConfigStatus } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    email: getEmailConfigStatus(),
    supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseAnon: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    supabaseServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  });
}
