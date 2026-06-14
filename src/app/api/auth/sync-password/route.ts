import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { password } = await req.json();

    if (!password || String(password).length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user?.email) {
      return NextResponse.json(
        { error: "Reset session expired. Request a new link from Forgot Password." },
        { status: 401 }
      );
    }

    const email = user.email.trim().toLowerCase();
    const hashedPassword = await bcrypt.hash(String(password), 10);

    await prisma.user.updateMany({
      where: { email },
      data: {
        password: hashedPassword,
        supabaseUserId: user.id,
        emailVerified: true,
        passwordResetToken: null,
        passwordResetExpiry: null,
      },
    });

    await supabase.auth.signOut();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[sync-password]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
