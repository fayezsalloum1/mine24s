import { NextResponse } from "next/server";
import { scanDeposits } from "@/lib/deposit-scanner";
import { processAllDueMiningEarnings } from "@/lib/mining";

export const dynamic = "force-dynamic";
export const maxDuration = 26;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deposits = await scanDeposits();
  const earnings = await processAllDueMiningEarnings();
  return NextResponse.json({ success: true, deposits, earnings });
}

export async function POST(req: Request) {
  return GET(req);
}