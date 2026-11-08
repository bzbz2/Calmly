"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { isValidEmail, normalizeEmail } from "@/lib/auth/email";
import { safeNext } from "@/lib/safeNext";

// Forgot password, in two steps on one page:
// 1. your email → we send a 6-digit code (valid 5 minutes)
// 2. the code + a new password → you're signed in and taken back where you were.

const INPUT = "rounded-lg border border-slate-300 bg-white px-3 py-2";
const BTN = "rounded-lg bg-indigo-600 py-2 text-white hover:bg-indigo-700 disabled:opacity-60";
const EMAIL_ERROR = "Please enter a valid email address, like name@example.com.";

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

async function post(url: string, body: unknown) {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
  if (!r) return { ok: false, data: { error: "Can't reach Calmly. Check your connection and try again." } };
  return { ok: r.ok, data: (await r.json().catch(() => ({}))) as Record<string, unknown> };
}

export default function ForgotPasswordForm() {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [expiresAt, setExpiresAt] = useState(0);
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const e = new URLSearchParams(window.location.search).get("email");
    if (e) setEmail(e);
  }, []);
  useEffect(() => {
    if (step !== "code") return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [step]);

  const left = Math.max(0, Math.ceil((expiresAt - now) / 1000));
  const resendIn = Math.max(0, Math.ceil((resendAt - now) / 1000));

  async function sendCode() {
    setError("");
    setNotice("");
    if (!isValidEmail(email)) return setError(EMAIL_ERROR);
    setBusy(true);
    const { ok, data } = await post("/api/password/forgot", { email: normalizeEmail(email) });
    setBusy(false);
    if (!ok) {
      setError(String(data.error ?? "We couldn't send the code. Please try again."));
      if (typeof data.retryAfter === "number" && data.retryAfter < 3600) setResendAt(Date.now() + data.retryAfter * 1000);
      return;
    }
    const t = Date.now();
    setNow(t);
    setExpiresAt(t + Number(data.expiresInSec ?? 300) * 1000);
    setResendAt(t + Number(data.resendInSec ?? 60) * 1000);
    setCode("");
    setStep("code");
    setNotice(`If ${normalizeEmail(email)} has a Calmly account, a 6-digit code is on its way. Check your inbox (and spam).`);
  }

  async function reset() {
    setError("");
    if (!/^\d{6}$/.test(code)) return setError("Enter the 6-digit code from the email.");
    if (left === 0) return setError("This code has expired (codes last 5 minutes). Please send a new code.");
    if (password.length < 8) return setError("Your new password needs at least 8 characters.");
    if (password !== confirm) return setError("The two passwords don't match.");
    setBusy(true);
    const { ok, data } = await post("/api/password/reset", { email: normalizeEmail(email), code, password });
    if (!ok) {
      setBusy(false);
      return setError(String(data.error ?? "We couldn't reset your password. Please try again."));
    }
    const res = await signIn("credentials", { email: normalizeEmail(email), password, redirect: false });
    if (res?.error) {
      setBusy(false);
      setNotice("Password changed. Please log in with your new password.");
      return;
    }
    window.location.href = safeNext(new URLSearchParams(window.location.search).get("next"));
  }

  return (
    <main className="mx-auto max-w-sm px-6 py-24">
      <h1 className="mb-2 text-2xl font-semibold">Reset your password 🌿</h1>
      {step === "email" ? (
        <form
          method="post"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            sendCode();
          }}
          className="mt-4 flex flex-col gap-3"
        >
          <p className="text-sm text-slate-600">Enter the email you signed up with and we&apos;ll send you a 6-digit code.</p>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            aria-invalid={!!error}
            className={INPUT}
          />
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <button disabled={busy || resendIn > 0} className={BTN}>
            {busy ? "Sending…" : resendIn > 0 ? `Send code (${resendIn}s)` : "Send code"}
          </button>
        </form>
      ) : (
        <form
          method="post"
          onSubmit={(e) => {
            e.preventDefault();
            reset();
          }}
          className="mt-4 flex flex-col gap-3"
        >
          {notice && <p role="status" className="text-sm text-slate-600">{notice}</p>}
          <input
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="6-digit code"
            aria-label="6-digit code"
            className={`${INPUT} text-center font-mono text-lg tracking-[0.4em]`}
          />
          <p className={`text-xs ${left > 0 ? "text-slate-500" : "text-red-600"}`} aria-live="polite">
            {left > 0 ? `Code expires in ${mmss(left)}` : "This code has expired. Send a new one."}
          </p>
          <input name="password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password (8+ characters)" className={INPUT} />
          <input name="confirm" type="password" autoComplete="new-password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm new password" className={INPUT} />
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <button disabled={busy || left === 0} className={BTN}>{busy ? "Saving…" : "Set new password"}</button>
          <div className="flex items-center justify-between text-sm">
            <button type="button" onClick={sendCode} disabled={busy || resendIn > 0} className="text-indigo-600 hover:underline disabled:text-slate-400 disabled:no-underline">
              {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
            </button>
            <button type="button" onClick={() => { setStep("email"); setError(""); setNotice(""); }} className="text-slate-500 hover:underline">
              Use a different email
            </button>
          </div>
        </form>
      )}
      <p className="mt-6 text-sm text-slate-600">
        Remembered it? <Link href="/login" className="text-indigo-600 underline">Back to log in</Link>
      </p>
    </main>
  );
}
