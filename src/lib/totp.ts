import { generateSecret, generateURI, verifySync } from "otplib";

export function create2FASecret() {
  return generateSecret();
}

export function create2FAUri(email: string, secret: string) {
  return generateURI({
    issuer: "Cloud Mining",
    label: email,
    secret,
  });
}

export function verify2FACode(secret: string, token: string): boolean {
  const result = verifySync({ secret, token });
  return result.valid;
}
