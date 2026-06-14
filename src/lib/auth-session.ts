import { encode } from "next-auth/jwt";

const SESSION_MAX_AGE_REMEMBER = 30 * 24 * 60 * 60;

export async function applyNextAuthSessionCookie(
  response: { cookies: { set: (name: string, value: string, options?: object) => void } },
  user: { id: string; email: string; role: string }
) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is required");

  const secure = process.env.NODE_ENV === "production";
  const sessionToken = await encode({
    token: {
      sub: user.id,
      id: user.id,
      email: user.email,
      role: user.role,
    },
    secret,
    maxAge: SESSION_MAX_AGE_REMEMBER,
  });

  const cookieName = secure
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";

  response.cookies.set(cookieName, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure,
    maxAge: SESSION_MAX_AGE_REMEMBER,
  });
}
