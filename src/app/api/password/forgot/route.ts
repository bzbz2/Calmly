import { NextResponse } from "next/server";
import { isValidEmail, normalizeEmail } from "@/lib/auth/otp";
import { requestResetCode } from "@/lib/auth/reset-server";

// Step 1 of "Forgot password": email a 6-digit code that works for 5 minutes.

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { email?: unknown } | null;
  if (!isValidEmail(body?.email)) {
    return NextResponse.json({ error: "Please enter a valid email address, like name@example.com." }, { status: 400 });
  }
  try {
    const r = await requestResetCode(normalizeEmail(body!.email));
    if (r.ok) return NextResponse.json(r);
    const headers = r.retryAfter ? { "Retry-After": String(r.retryAfter) } : undefined;
    return NextResponse.json({ error: r.error, reason: r.reason, retryAfter: r.retryAfter }, { status: r.status, headers });
  } catch (e) {
    console.error("forgot password error", e);
    return NextResponse.json({ error: "Something went wrong on our side. Please try again." }, { status: 500 });
  }
}
