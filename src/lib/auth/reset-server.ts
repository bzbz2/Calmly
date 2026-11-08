// "Forgot password", server side: issue a code by email, then check it and set the
// new password. Pure rules are in ./otp.ts, the mail client in ./smtp.ts.

import bcrypt from "bcryptjs";
import { and, desc, eq, gte, isNull, sql } from "drizzle-orm";
import { db, passwordResetCodes, users } from "@/db";
import {
  CODE_ERRORS,
  OTP_MAX_ATTEMPTS,
  OTP_MAX_PER_HOUR,
  OTP_RESEND_MS,
  OTP_TTL_MS,
  codeProblem,
  hashOtp,
  newOtp,
  otpEmail,
  otpMatches,
  resendWait,
  sendFailureMessage,
} from "./otp";
import { SmtpError, sendMail } from "./smtp";

type Result = { ok: true; expiresInSec: number; resendInSec: number } | { ok: false; status: number; error: string; reason?: string; retryAfter?: number };

const secret = () => {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return s;
};

/**
 * Send a reset code to `email` (already validated and normalized). For an email with
 * no account we answer exactly as if we had sent one, so this can't be used to find
 * out who has an account.
 */
export async function requestResetCode(email: string, now = new Date()): Promise<Result> {
  const recent = await db
    .select({ createdAt: passwordResetCodes.createdAt })
    .from(passwordResetCodes)
    .where(and(eq(passwordResetCodes.email, email), gte(passwordResetCodes.createdAt, new Date(now.getTime() - 60 * 60 * 1000))))
    .orderBy(desc(passwordResetCodes.createdAt));
  const wait = resendWait(recent[0]?.createdAt, now);
  if (wait > 0) return { ok: false, status: 429, error: `Please wait ${wait} seconds before asking for another code.`, retryAfter: wait };
  if (recent.length >= OTP_MAX_PER_HOUR) return { ok: false, status: 429, error: "Too many codes were requested for this email. Please try again in an hour.", retryAfter: 3600 };

  const ok = { ok: true as const, expiresInSec: OTP_TTL_MS / 1000, resendInSec: OTP_RESEND_MS / 1000 };
  const [user] = await db.select({ id: users.id }).from(users).where(and(eq(users.email, email), eq(users.isGuest, false))).limit(1);
  if (!user) return ok;

  const code = newOtp();
  // A new code replaces any older one that's still open.
  await db
    .update(passwordResetCodes)
    .set({ expiresAt: now })
    .where(and(eq(passwordResetCodes.email, email), isNull(passwordResetCodes.usedAt), gte(passwordResetCodes.expiresAt, now)));
  const [row] = await db
    .insert(passwordResetCodes)
    .values({ userId: user.id, email, codeHash: hashOtp(email, code, secret()), expiresAt: new Date(now.getTime() + OTP_TTL_MS), createdAt: now })
    .returning({ id: passwordResetCodes.id });

  // Local testing on a network that blocks SMTP: print the code instead of emailing it.
  // Opt-in, and never in production.
  if (process.env.NODE_ENV !== "production" && process.env.DEV_LOG_RESET_CODES === "1") {
    console.log(`\n[dev] password reset code for ${email}: ${code} (expires in 5 minutes)\n`);
    return ok;
  }

  try {
    await sendMail({ to: email, ...otpEmail(code) });
  } catch (e) {
    // Not sent: drop the code so it neither works nor counts against the resend limits.
    await db.delete(passwordResetCodes).where(eq(passwordResetCodes.id, row.id));
    const err = e instanceof SmtpError ? e : new SmtpError(String(e), "connect");
    console.error(`password reset email failed [${err.stage}${err.code ? ` ${err.code}` : ""}]: ${err.message}`);
    return { ok: false, reason: err.stage, ...sendFailureMessage(err.stage, err.code) };
  }
  return ok;
}

/** Check the code and set the new password. */
export async function resetPassword(email: string, code: string, password: string, now = new Date()): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const [c] = await db
    .select()
    .from(passwordResetCodes)
    .where(eq(passwordResetCodes.email, email))
    .orderBy(desc(passwordResetCodes.createdAt))
    .limit(1);
  const problem = codeProblem(c, now);
  if (problem) return { ok: false, status: 400, error: CODE_ERRORS[problem] };

  if (!otpMatches(c.codeHash, email, code, secret())) {
    const [u] = await db
      .update(passwordResetCodes)
      .set({ attempts: sql`${passwordResetCodes.attempts} + 1` })
      .where(eq(passwordResetCodes.id, c.id))
      .returning({ attempts: passwordResetCodes.attempts });
    const left = OTP_MAX_ATTEMPTS - (u?.attempts ?? OTP_MAX_ATTEMPTS);
    return { ok: false, status: 400, error: left > 0 ? `${CODE_ERRORS.wrong} (${left} ${left === 1 ? "try" : "tries"} left)` : CODE_ERRORS.locked };
  }

  // Claim the code first, so it can only ever be used once.
  const [claimed] = await db
    .update(passwordResetCodes)
    .set({ usedAt: now })
    .where(and(eq(passwordResetCodes.id, c.id), isNull(passwordResetCodes.usedAt)))
    .returning({ userId: passwordResetCodes.userId });
  if (!claimed) return { ok: false, status: 400, error: CODE_ERRORS.used };

  await db.update(users).set({ passwordHash: await bcrypt.hash(password, 10) }).where(eq(users.id, claimed.userId));
  return { ok: true };
}
