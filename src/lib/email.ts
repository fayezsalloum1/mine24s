import { BRAND_NAME } from "./constants";

export type SmtpConfig = {
  host: string;
  user: string;
  pass: string;
  port: number;
  from: string;
  fromName: string;
  service?: string;
  secure: boolean;
};

function validateSenderEmail(email: string): string | null {
  if (email.endsWith("@smtp-brevo.com")) {
    return "SMTP_FROM cannot be your @smtp-brevo.com login. Use a verified sender email from Brevo → Senders (e.g. your Gmail or noreply@yourdomain.com).";
  }
  return null;
}

function getBrevoApiKey() {
  return process.env.BREVO_API_KEY?.trim();
}

function getResendApiKey() {
  return process.env.RESEND_API_KEY?.trim();
}

function getSenderEmail() {
  return (process.env.SMTP_FROM || process.env.BREVO_SENDER_EMAIL)?.trim() || null;
}

function getResendSenderEmail() {
  return getSenderEmail() || "onboarding@resend.dev";
}

function getSenderName() {
  return (process.env.SMTP_FROM_NAME || process.env.BREVO_SENDER_NAME || BRAND_NAME).trim();
}

export function getEmailMode(): "resend" | "brevo-api" | "brevo-smtp" | "smtp" | "none" {
  if (getResendApiKey()) return "resend";
  if (getBrevoApiKey() && getSenderEmail()) return "brevo-api";
  const config = getSmtpConfig();
  if (!config) return "none";
  if (isBrevoHost(config.host)) return "brevo-smtp";
  return "smtp";
}

function isBrevoHost(host: string) {
  return /brevo|sendinblue/i.test(host);
}

export function getSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  let pass = process.env.SMTP_PASS?.trim();
  if (!host || !user || !pass) return null;

  if (host.includes("gmail")) {
    pass = pass.replace(/\s/g, "");
  }

  const port = Number(process.env.SMTP_PORT || (isBrevoHost(host) ? 587 : 587));
  const sender = getSenderEmail();
  if (isBrevoHost(host) && !sender) return null;
  const from = (sender || user).trim();
  const fromName = getSenderName();
  const service = process.env.SMTP_SERVICE?.trim() || undefined;
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  return { host, user, pass, port, from, fromName, service, secure };
}

export function isEmailConfigured() {
  return getEmailConfigStatus().configured;
}

export function getEmailConfigIssues(): string[] {
  const issues: string[] = [];

  if (getResendApiKey()) {
    return issues;
  }

  const apiKey = getBrevoApiKey();
  const sender = getSenderEmail();
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  if (apiKey && !sender) {
    issues.push("BREVO_API_KEY is set but SMTP_FROM is missing. Add a verified sender email.");
  }

  if (!apiKey && host && user && pass && isBrevoHost(host) && !sender) {
    issues.push(
      "SMTP_FROM is required for Brevo. Verify a sender in Brevo → Senders, Domains & Dedicated IPs → Senders, then set SMTP_FROM to that email."
    );
  }

  if (sender) {
    const senderError = validateSenderEmail(sender);
    if (senderError) issues.push(senderError);
  }

  if (!apiKey && (!host || !user || !pass)) {
    if (!host) issues.push("SMTP_HOST is not set.");
    if (!user) issues.push("SMTP_USER is not set.");
    if (!pass) issues.push("SMTP_PASS is not set.");
  }

  if (host && user && pass && isBrevoHost(host)) {
    if (!user.includes("@")) {
      issues.push("SMTP_USER looks invalid. For Brevo use your SMTP login from Brevo → SMTP & API → SMTP.");
    }
  }

  return issues;
}

export function getEmailConfigStatus() {
  const mode = getEmailMode();
  const sender = mode === "resend" ? getResendSenderEmail() : getSenderEmail();
  const issues = getEmailConfigIssues();
  return {
    configured: mode !== "none" && issues.length === 0,
    mode,
    resendApiKey: Boolean(getResendApiKey()),
    brevoApiKey: Boolean(getBrevoApiKey()),
    host: Boolean(process.env.SMTP_HOST?.trim()),
    user: Boolean(process.env.SMTP_USER?.trim()),
    pass: Boolean(process.env.SMTP_PASS?.trim()),
    sender: Boolean(sender),
    from: Boolean(sender),
    fromAddress: sender || undefined,
    port: process.env.SMTP_PORT || "587",
    issues,
    hint:
      issues[0] ||
      (mode === "resend"
        ? "Using Resend API."
        : mode === "brevo-api"
          ? "Using Brevo API (recommended on Vercel)."
          : mode === "brevo-smtp"
            ? "Using Brevo SMTP relay."
            : undefined),
  };
}

function formatBrevoApiError(status: number, body: string): string {
  if (status === 401 || status === 403) {
    return "Brevo API key invalid. Set BREVO_API_KEY in Vercel (Brevo → SMTP & API → API keys).";
  }
  if (body.includes("sender") || body.includes("not verified")) {
    return "Brevo sender not verified. Add SMTP_FROM as a verified sender in Brevo → Senders & IP.";
  }
  if (body.includes("permission")) {
    return "Brevo API key lacks permission. Enable “Send transactional emails” on the key.";
  }
  try {
    const parsed = JSON.parse(body) as { message?: string };
    if (parsed.message) return `Brevo: ${parsed.message}`;
  } catch {
    /* ignore */
  }
  return `Brevo API error (${status})`;
}

function formatResendError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.startsWith("Resend:")) return msg;
  if (/invalid api key|unauthorized|401|403/i.test(msg)) {
    return "Resend API key invalid. Set RESEND_API_KEY in your environment.";
  }
  return `Resend: ${msg.length > 120 ? `${msg.slice(0, 120)}…` : msg}`;
}

export function formatSmtpError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  const code = err && typeof err === "object" && "code" in err ? String(err.code) : "";

  if (msg.startsWith("Resend:")) return msg;
  if (msg.startsWith("Brevo:") || msg.startsWith("Brevo API")) return msg;

  if (
    msg.includes("535") ||
    msg.includes("534") ||
    /invalid login|authentication failed|auth/i.test(msg)
  ) {
    if (/brevo|sendinblue/i.test(process.env.SMTP_HOST || "")) {
      return "Brevo SMTP login failed. SMTP_USER = your Brevo login email. SMTP_PASS = SMTP key (not API key) from Brevo → SMTP & API → SMTP keys.";
    }
    return "SMTP login failed. Check SMTP_USER and SMTP_PASS.";
  }
  if (msg.includes("EAUTH") || code === "EAUTH") {
    return "SMTP authentication rejected. For Brevo use your SMTP key as SMTP_PASS, or set BREVO_API_KEY instead.";
  }
  if (msg.includes("ECONNECTION") || msg.includes("ETIMEDOUT") || code === "ECONNECTION") {
    return "Could not connect to mail server. Brevo SMTP: smtp-relay.brevo.com port 587.";
  }
  if (msg.includes("Message failed") || msg.includes("sender")) {
    return "Sender rejected. SMTP_FROM must be a verified sender in your Brevo account.";
  }

  return `Email send failed: ${msg.length > 120 ? `${msg.slice(0, 120)}…` : msg}`;
}

async function sendViaBrevoApi(to: string, subject: string, html: string) {
  const apiKey = getBrevoApiKey();
  const senderEmail = getSenderEmail();
  if (!apiKey || !senderEmail) {
    throw new Error("Brevo API not configured (need BREVO_API_KEY + SMTP_FROM)");
  }

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: getSenderName(), email: senderEmail },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(formatBrevoApiError(res.status, body));
  }
}

async function sendViaResend(to: string, subject: string, html: string) {
  const apiKey = getResendApiKey();
  if (!apiKey) {
    throw new Error("Resend API not configured (need RESEND_API_KEY)");
  }

  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);
  const fromEmail = getResendSenderEmail();
  const from = `${getSenderName()} <${fromEmail}>`;

  const { error } = await resend.emails.send({
    from,
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(`Resend: ${error.message}`);
  }
}

async function createMailTransporter() {
  const config = getSmtpConfig();
  if (!config) throw new Error("SMTP not configured");

  const nodemailer = await import("nodemailer");

  if (config.service) {
    return nodemailer.createTransport({
      service: config.service,
      auth: { user: config.user, pass: config.pass },
    });
  }

  if (isBrevoHost(config.host)) {
    return nodemailer.createTransport({
      host: config.host,
      port: config.port || 587,
      secure: false,
      auth: { user: config.user, pass: config.pass },
    });
  }

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
    requireTLS: !config.secure && config.port === 587,
    tls: { minVersion: "TLSv1.2" },
  });
}

async function sendViaSmtp(to: string, subject: string, html: string) {
  const config = getSmtpConfig();
  if (!config) throw new Error("SMTP not configured");

  const transporter = await createMailTransporter();
  const fromHeader = config.fromName
    ? `"${config.fromName}" <${config.from}>`
    : config.from;

  await transporter.sendMail({
    from: fromHeader,
    to,
    subject,
    html,
  });
}

/** Verify email credentials (admin test). */
export async function verifyEmailConnection() {
  const mode = getEmailMode();
  if (mode === "resend") {
    const apiKey = getResendApiKey()!;
    const res = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(formatResendError(`Resend: ${body || res.statusText}`));
    }
    return true;
  }
  if (mode === "brevo-api") {
    const apiKey = getBrevoApiKey()!;
    const res = await fetch("https://api.brevo.com/v3/account", {
      headers: { "api-key": apiKey, Accept: "application/json" },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(formatBrevoApiError(res.status, body));
    }
    return true;
  }
  if (mode === "none") throw new Error("Email not configured");
  const transporter = await createMailTransporter();
  await transporter.verify();
  return true;
}

/** @deprecated use verifyEmailConnection */
export const verifySmtpConnection = verifyEmailConnection;

export async function sendEmail(to: string, subject: string, html: string) {
  const issues = getEmailConfigIssues();
  if (issues.length > 0) {
    const error = issues[0];
    console.error(`[Email] Not configured: ${error}`);
    return { sent: false as const, error };
  }

  const mode = getEmailMode();
  if (mode === "none") {
    console.log(`[Email skipped] To: ${to}, Subject: ${subject}`);
    return { sent: false as const, error: "Email not configured" };
  }

  const senderEmail = getSenderEmail();
  if (senderEmail) {
    const senderError = validateSenderEmail(senderEmail);
    if (senderError) return { sent: false as const, error: senderError };
  }

  try {
    if (mode === "resend") {
      await sendViaResend(to, subject, html);
    } else if (mode === "brevo-api") {
      await sendViaBrevoApi(to, subject, html);
    } else {
      await sendViaSmtp(to, subject, html);
    }
    return { sent: true as const };
  } catch (err) {
    const error = mode === "resend" ? formatResendError(err) : formatSmtpError(err);
    console.error(`[Email] Failed (${mode}) to ${to}:`, err);
    return { sent: false as const, error };
  }
}

export function welcomeEmailHtml(email: string, referralLink: string) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1f2937;color:#fff;padding:24px;border-radius:8px;">
      <h1 style="color:#eab308;">Welcome to ${BRAND_NAME}!</h1>
      <p>Hi ${email},</p>
      <p>Your email has been verified. Your account is ready — start mining today!</p>
      <p>Share your referral link and earn 10% commission:</p>
      <p style="background:#374151;padding:12px;border-radius:4px;word-break:break-all;">${referralLink}</p>
      <p style="color:#9ca3af;font-size:12px;">${BRAND_NAME} Team</p>
    </div>
  `;
}

export function emailVerificationHtml(code: string) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#111827;color:#fff;padding:32px;border-radius:12px;">
      <h1 style="color:#eab308;margin:0 0 16px;">Verify Your Email</h1>
      <p style="color:#d1d5db;line-height:1.6;">Enter this code on the verification page to activate your ${BRAND_NAME} account:</p>
      <div style="background:#1f2937;border:2px solid #eab308;border-radius:8px;padding:20px;text-align:center;margin:24px 0;">
        <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#eab308;">${code}</span>
      </div>
      <p style="color:#9ca3af;font-size:14px;">This code expires in <strong style="color:#fff;">15 minutes</strong>.</p>
      <p style="color:#6b7280;font-size:12px;margin-top:24px;">If you didn't create an account, you can ignore this email.</p>
    </div>
  `;
}

export function passwordResetHtml(resetLink: string) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#111827;color:#fff;padding:32px;border-radius:12px;">
      <h1 style="color:#eab308;margin:0 0 16px;">Reset Your Password</h1>
      <p style="color:#d1d5db;line-height:1.6;">We received a request to reset your ${BRAND_NAME} password. Click the button below to choose a new password:</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${resetLink}" style="display:inline-block;background:#eab308;color:#000;font-weight:bold;padding:14px 32px;border-radius:8px;text-decoration:none;">Reset Password</a>
      </div>
      <p style="color:#9ca3af;font-size:14px;">This link expires in <strong style="color:#fff;">1 hour</strong>.</p>
      <p style="color:#6b7280;font-size:12px;word-break:break-all;margin-top:16px;">Or copy this link: ${resetLink}</p>
      <p style="color:#6b7280;font-size:12px;margin-top:24px;">If you didn't request a password reset, you can ignore this email.</p>
    </div>
  `;
}

export function depositConfirmedHtml(amount: number) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1f2937;color:#fff;padding:24px;border-radius:8px;">
      <h1 style="color:#eab308;">Deposit Confirmed</h1>
      <p>Your deposit of <strong style="color:#22c55e;">$${amount.toFixed(2)}</strong> has been confirmed and added to your balance.</p>
    </div>
  `;
}

export function withdrawalStatusHtml(amount: number, approved: boolean) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1f2937;color:#fff;padding:24px;border-radius:8px;">
      <h1 style="color:#eab308;">Withdrawal ${approved ? "Approved" : "Rejected"}</h1>
      <p>Your withdrawal request of <strong>$${amount.toFixed(2)}</strong> has been <strong style="color:${approved ? "#22c55e" : "#ef4444"};">${approved ? "approved" : "rejected"}</strong>.</p>
    </div>
  `;
}

export function referralCommissionHtml(amount: number) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1f2937;color:#fff;padding:24px;border-radius:8px;">
      <h1 style="color:#eab308;">Referral Commission Earned!</h1>
      <p>You earned <strong style="color:#22c55e;">$${amount.toFixed(2)}</strong> referral commission!</p>
    </div>
  `;
}
