import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { getPlatformSettings, updatePlatformSettings } from "@/lib/platform-settings";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const settings = await getPlatformSettings();
  return NextResponse.json(settings);
}

export async function PATCH(req: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const body = await req.json();

  if (typeof body.requireReferralForWithdrawal !== "boolean") {
    return NextResponse.json(
      { error: "requireReferralForWithdrawal must be a boolean" },
      { status: 400 }
    );
  }

  const settings = await updatePlatformSettings({
    requireReferralForWithdrawal: body.requireReferralForWithdrawal,
  });

  return NextResponse.json(settings);
}
