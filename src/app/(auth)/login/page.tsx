"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { safeNext } from "@/lib/safeNext";
import { signIn } from "next-auth/react";

export default function Login() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  // Keep ?next= when switching between log in and sign up (e.g. from a gift link).
  const [q, setQ] = useState("");
  useEffect(() => setQ(window.location.search), []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    const res = await signIn("credentials", { email: f.get("email"), password: f.get("password"), redirect: false });
    setBusy(false);
    if (res?.error) setError("Invalid email or password.");
    else window.location.href = safeNext(new URLSearchParams(window.location.search).get("next"));
  }

  return (
    <main className="mx-auto max-w-sm px-6 py-24">
      <h1 className="mb-6 text-2xl font-semibold">Welcome back 🌿</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input name="email" type="email" required placeholder="Email" className="rounded-lg border border-slate-300 bg-white px-3 py-2" />
        <input name="password" type="password" required minLength={8} placeholder="Password" className="rounded-lg border border-slate-300 bg-white px-3 py-2" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={busy} className="rounded-lg bg-indigo-600 py-2 text-white hover:bg-indigo-700 disabled:opacity-60">{busy ? "Signing in…" : "Log in"}</button>
      </form>
      <p className="mt-4 text-sm text-slate-600">New here? <Link href={`/register${q}`} className="text-indigo-600 underline">Create an account</Link></p>
    </main>
  );
}
