import { NextResponse } from "next/server";
import { getEmailConfigStatus } from "@/lib/email";

export const dynamic = "force-dynamic";

/** Temporary debug endpoint — remove before production hardening. */
export async function GET() {
  return NextResponse.json(getEmailConfigStatus());
}
