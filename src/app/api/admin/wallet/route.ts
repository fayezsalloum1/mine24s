import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { getAdminWalletStatus } from "@/lib/sweep";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const status = await getAdminWalletStatus();
  return NextResponse.json(status);
}
