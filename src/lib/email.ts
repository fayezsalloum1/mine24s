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
