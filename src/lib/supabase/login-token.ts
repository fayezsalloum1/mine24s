import { createHmac, timingSafeEqual } from "crypto";

const TOKEN_TTL_MS = 5 * 60 * 1000;

function getSecret() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is required for Supabase login tokens");
  return secret;
}

export function createSupabaseLoginToken(email: string): string {
  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = `${email.trim().toLowerCase()}:${exp}`;
  const sig = createHmac("sha256", getSecret()).update(payload).digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export function verifySupabaseLoginToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const lastColon = decoded.lastIndexOf(":");
    if (lastColon === -1) return null;

    const payload = decoded.slice(0, lastColon);
    const sig = decoded.slice(lastColon + 1);
    const expected = createHmac("sha256", getSecret()).update(payload).digest("hex");

    const sigBuf = Buffer.from(sig, "hex");
    const expectedBuf = Buffer.from(expected, "hex");
    if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }

    const colonIdx = payload.lastIndexOf(":");
    if (colonIdx === -1) return null;

    const email = payload.slice(0, colonIdx);
    const exp = Number(payload.slice(colonIdx + 1));
    if (!email || !Number.isFinite(exp) || Date.now() > exp) return null;

    return email;
  } catch {
    return null;
  }
}
