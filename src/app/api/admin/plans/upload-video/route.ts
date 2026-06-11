import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { savePlanVideo } from "@/lib/plan-media-upload";

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Video file is required" }, { status: 400 });
    }

    const result = await savePlanVideo(file);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export const dynamic = "force-dynamic";
