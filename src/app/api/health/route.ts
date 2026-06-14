import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEmailConfigStatus } from "@/lib/email";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      database: "connected",
      environment: process.env.NODE_ENV ?? "development",
      email: getEmailConfigStatus(),
      appUrl: Boolean(process.env.APP_URL?.trim() || process.env.NEXTAUTH_URL?.trim()),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database unreachable";
    return NextResponse.json({ ok: false, database: "error", error: message }, { status: 503 });
  }
}
