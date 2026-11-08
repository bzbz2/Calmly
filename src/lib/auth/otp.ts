// Password reset by one-time code: the pure parts (validation, codes, limits, and
// turning a failed send into a message a person can act on). Unit-tested.

import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

/** A code works for 5 minutes. */
export const OTP_TTL_MS = 5 * 60 * 1000;
/** Wrong guesses allowed per code before it's burned. */
export const OTP_MAX_ATTEMPTS = 5;
/** Wait this long before asking for another code. */
export const OTP_RESEND_MS = 60 * 1000;
/** Codes per email per hour, so nobody can flood someone's inbox. */
export const OTP_MAX_PER_HOUR = 5;
export const OTP_LENGTH = 6;
export const PASSWORD_MIN = 8;

export { isValidEmail, normalizeEmail } from "./email";
import { normalizeEmail } from "./email";

/** A 6-digit code, uniformly random (leading zeros allowed). */
export const newOtp = () => String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, "0");

/** What we store: a keyed hash tied to the email, never the code itself. */
export function hashOtp(email: string, code: string, secret: string): string {
  return createHmac("sha256", secret).update(`${normalizeEmail(email)}:${code}`).digest("base64url");
}

export function otpMatches(stored: string, email: string, code: string, secret: string): boolean {
  if (!/^\d{6}$/.test(code)) return false;
  const a = Buffer.from(stored);
  const b = Buffer.from(hashOtp(email, code, secret));
  return a.length === b.length && timingSafeEqual(a, b);
}

export type CodeState = { expiresAt: Date; usedAt: Date | null; attempts: number };

/** Why a stored code can't be used any more, or null if it still can. */
export function codeProblem(c: CodeState | undefined, now: Date): "missing" | "used" | "expired" | "locked" | null {
  if (!c) return "missing";
  if (c.usedAt) return "used";
  if (c.expiresAt.getTime() <= now.getTime()) return "expired";
  if (c.attempts >= OTP_MAX_ATTEMPTS) return "locked";
  return null;
}

export const CODE_ERRORS: Record<"missing" | "used" | "expired" | "locked" | "wrong", string> = {
  missing: "No code was requested for this email. Please send a new code.",
  used: "This code was already used. Please send a new code.",
  expired: "This code has expired (codes last 5 minutes). Please send a new code.",
  locked: "Too many wrong tries. Please send a new code.",
  wrong: "That code isn't right. Check the email and try again.",
};

/** Seconds until another code may be sent, given the last send time (0 = now). */
export function resendWait(lastSentAt: Date | undefined, now: Date): number {
  if (!lastSentAt) return 0;
  return Math.max(0, Math.ceil((lastSentAt.getTime() + OTP_RESEND_MS - now.getTime()) / 1000));
}

/** Where sending failed, as reported by the SMTP client. */
export type SendStage = "config" | "connect" | "tls" | "auth" | "sender" | "recipient" | "data" | "timeout";

/**
 * A message the person can act on, for a failed send. Server details (host, reply
 * text) go to the log, not to the browser.
 */
export function sendFailureMessage(stage: SendStage, code?: number): { status: number; error: string } {
  if (stage === "config") return { status: 503, error: "Email isn't set up on the server yet, so we can't send a code. Please contact support." };
  if (stage === "recipient" && code && code >= 500)
    return { status: 400, error: "The mail server rejected this email address. Please check it and try again." };
  if (code === 421 || code === 450 || code === 451 || code === 452)
    return { status: 503, error: "The email service is busy right now. Please try again in a few minutes." };
  switch (stage) {
    case "connect":
      return { status: 502, error: "We couldn't reach the email server. Please try again in a minute." };
    case "timeout":
      return { status: 504, error: "The email server took too long to answer. Please try again." };
    case "tls":
      return { status: 502, error: "We couldn't open a secure connection to the email server. Please try again later." };
    case "auth":
      return { status: 502, error: "The email server didn't accept our sign-in, so the code wasn't sent. Please try again later or contact support." };
    case "sender":
      return { status: 502, error: "The email server refused our sender address, so the code wasn't sent. Please contact support." };
    default:
      return { status: 502, error: "We couldn't send the code right now. Please try again." };
  }
}

export function otpEmail(code: string) {
  const subject = "Your Calmly password reset code";
  const text = [
    `Your Calmly code is ${code}.`,
    "",
    "Enter it on the reset page to choose a new password. It expires in 5 minutes.",
    "If you didn't ask to reset your password, you can ignore this email; your password stays the same.",
  ].join("\n");
  const html = `<div style="font-family:system-ui,-apple-system,sans-serif;color:#1e293b;max-width:420px">
<p style="font-size:16px">🌿 Calmly</p>
<p>Your password reset code is:</p>
<p style="font-size:32px;font-weight:700;letter-spacing:6px;margin:12px 0">${code}</p>
<p>It expires in <b>5 minutes</b>.</p>
<p style="color:#64748b;font-size:13px">If you didn't ask to reset your password, you can ignore this email; your password stays the same.</p>
</div>`;
  return { subject, text, html };
}
