import { BRAND_NAME } from "./constants";

export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.SMTP_HOST) {
    console.log(`[Email skipped] To: ${to}, Subject: ${subject}`);
    return;
  }
  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
  });
}

export function welcomeEmailHtml(email: string, referralLink: string) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1f2937;color:#fff;padding:24px;border-radius:8px;">
      <h1 style="color:#eab308;">Welcome to ${BRAND_NAME}!</h1>
      <p>Hi ${email},</p>
      <p>Your account has been created successfully. Start mining today!</p>
      <p>Share your referral link and earn 10% commission:</p>
      <p style="background:#374151;padding:12px;border-radius:4px;word-break:break-all;">${referralLink}</p>
      <p style="color:#9ca3af;font-size:12px;">${BRAND_NAME} Team</p>
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
