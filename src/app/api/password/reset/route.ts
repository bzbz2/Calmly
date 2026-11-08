import { NextResponse } from "next/server";
import { isValidEmail, normalizeEmail, PASSWORD_MIN } from "@/lib/auth/otp";
import { resetPassword } from "@/lib/auth/reset-server";

// Step 2 of "Forgot password": the code from the email + a new password.

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { email?: unknown; code?: unknown; password?: unknown } | null;
  if (!isValidEmail(body?.email)) return NextResponse.json({ error: "Please enter a valid email address, like name@example.com." }, { status: 400 });
  const code = typeof body?.code === "string" ? body.code.replace(/\s/g, "") : "";
  if (!/^\d{6}$/.test(code)) return NextResponse.json({ error: "Enter the 6-digit code from the email." }, { status: 400 });
  const password = typeof body?.password === "string" ? body.password : "";
  if (password.length < PASSWORD_MIN || password.length > 200) {
    return NextResponse.json({ error: `Your new password needs at least ${PASSWORD_MIN} characters.` }, { status: 400 });
  }
  try {
    const r = await resetPassword(normalizeEmail(body!.email), code, password);
    return r.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: r.error }, { status: r.status });
  } catch (e) {
    console.error("reset password error", e);
    return NextResponse.json({ error: "Something went wrong on our side. Please try again." }, { status: 500 });
  }
}
