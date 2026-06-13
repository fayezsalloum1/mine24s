import { NextResponse } from "next/server";
import { getEmailConfigStatus } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getEmailConfigStatus());
}
