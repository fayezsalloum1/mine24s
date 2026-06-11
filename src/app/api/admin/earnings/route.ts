import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { processDailyEarningsForUser } from "@/lib/earnings";

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { userId } = await req.json();
  if (!userId) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 });
  }

  const result = await processDailyEarningsForUser(userId);
  return NextResponse.json({ success: true, ...result });
}