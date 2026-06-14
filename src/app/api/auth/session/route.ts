import { NextResponse } from "next/server";
import { getAppUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const { appUser, requires2FA } = await getAppUser();
  return NextResponse.json({
    user: appUser,
    requires2FA,
    authenticated: Boolean(appUser),
  });
}
