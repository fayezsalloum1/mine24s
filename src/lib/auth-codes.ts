import crypto from "crypto";

export function generateSixDigitCode() {
  return crypto.randomInt(100000, 999999).toString();
}

export function generateResetToken() {
  return crypto.randomBytes(32).toString("hex");
}

export const EMAIL_VERIFICATION_TTL_MS = 15 * 60 * 1000;
export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;
export const MAX_VERIFICATION_ATTEMPTS = 5;
export const VERIFICATION_LOCKOUT_MS = 15 * 60 * 1000;
export const MAX_PASSWORD_RESET_REQUESTS_PER_HOUR = 3;
export const PASSWORD_RESET_WINDOW_MS = 60 * 60 * 1000;
