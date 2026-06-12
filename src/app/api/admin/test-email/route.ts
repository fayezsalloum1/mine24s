import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { getEmailConfigStatus, sendEmail, verifyEmailConnection, formatSmtpError } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const status = getEmailConfigStatus();
  if (!status.configured) {
    return NextResponse.json({
      ok: false,
      ...status,
      error: status.hint || status.issues[0] || "SMTP env vars not set",
    });
  }

  try {
    await verifyEmailConnection();
    return NextResponse.json({ ok: true, ...status, connection: "verified" });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      ...status,
      connection: "failed",
      error: formatSmtpError(err),
    });
  }
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { to } = await req.json();
  const target = (to || auth.session?.user?.email)?.trim();
  if (!target) {
    return NextResponse.json({ error: "Recipient email required" }, { status: 400 });
  }

  const result = await sendEmail(
    target,
    "SMTP test — Cloud Mining",
    "<p>If you received this, SMTP is working correctly.</p>"
  );

  if (!result.sent) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 502 });
  }

  return NextResponse.json({ ok: true, message: `Test email sent to ${target}` });
}
