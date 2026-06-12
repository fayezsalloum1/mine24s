import nodemailer from "nodemailer";
import { readFileSync } from "fs";
import { resolve } from "path";

function loadEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  } catch {
    /* ignore */
  }
}

loadEnv();

const host = process.env.SMTP_HOST?.trim();
const user = process.env.SMTP_USER?.trim();
const pass = process.env.SMTP_PASS?.trim();
const port = Number(process.env.SMTP_PORT || 587);
const from = process.env.SMTP_FROM?.trim();
const to = process.argv[2] || from;

console.log("SMTP_HOST:", host || "(missing)");
console.log("SMTP_USER:", user ? `${user.slice(0, 6)}…` : "(missing)");
console.log("SMTP_PASS:", pass ? "(set)" : "(missing)");
console.log("SMTP_FROM:", from || "(missing — REQUIRED for Brevo)");
console.log("SMTP_PORT:", port);

if (!host || !user || !pass) {
  console.error("\nMissing SMTP_HOST, SMTP_USER, or SMTP_PASS");
  process.exit(1);
}

if (!from) {
  console.error("\nSMTP_FROM is empty. Brevo requires a verified sender email.");
  console.error("Go to Brevo → Senders, Domains & Dedicated IPs → Senders, verify your email, then set SMTP_FROM.");
  process.exit(1);
}

if (from.endsWith("@smtp-brevo.com")) {
  console.error("\nSMTP_FROM cannot be @smtp-brevo.com — use your verified personal/domain email.");
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: false,
  auth: { user, pass },
});

try {
  await transporter.verify();
  console.log("\nConnection: OK");
} catch (err) {
  console.error("\nConnection FAILED:", err.message);
  process.exit(1);
}

if (!to) {
  console.log("\nNo recipient — pass email as argument to send test.");
  process.exit(0);
}

try {
  await transporter.sendMail({
    from: `"${process.env.SMTP_FROM_NAME || "Simple Mining"}" <${from}>`,
    to,
    subject: "SMTP test — Simple Mining",
    html: "<p>If you received this, SMTP is working.</p>",
  });
  console.log(`\nTest email sent to ${to}`);
} catch (err) {
  console.error("\nSend FAILED:", err.message);
  process.exit(1);
}
