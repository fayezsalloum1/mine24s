import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      database: "connected",
      environment: process.env.NODE_ENV ?? "development",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database unreachable";
    return NextResponse.json({ ok: false, database: "error", error: message }, { status: 503 });
  }
}
