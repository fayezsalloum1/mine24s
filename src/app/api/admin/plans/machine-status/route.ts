import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { setPlanMachineOnline, setPlanMachineUptimeHours } from "@/lib/machine-status-server";

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const body = await req.json();
  const { id, online, uptimeHours } = body;

  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Plan id required" }, { status: 400 });
  }

  try {
    let plan;
    if (typeof online === "boolean") {
      plan = await setPlanMachineOnline(id, online);
    }
    if (uptimeHours != null) {
      plan = await setPlanMachineUptimeHours(id, Number(uptimeHours));
    }
    if (!plan) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }
    return NextResponse.json(plan);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Update failed" },
      { status: 400 }
    );
  }
}

export const dynamic = "force-dynamic";
