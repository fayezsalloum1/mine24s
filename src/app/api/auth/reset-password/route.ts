import { NextResponse } from "next/server";

/** Legacy token-based reset — replaced by Supabase Auth recovery flow. */
export async function GET() {
  return NextResponse.json(
    {
      valid: false,
      error: "This reset link format is no longer supported. Use Forgot Password to receive a new Supabase reset email.",
      deprecated: true,
    },
    { status: 410 }
  );
}

export async function POST() {
  return NextResponse.json(
    {
      error: "Password reset now uses Supabase. Go to Forgot Password and request a new link.",
      deprecated: true,
    },
    { status: 410 }
  );
}
