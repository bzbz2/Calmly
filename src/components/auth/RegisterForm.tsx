"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AuthBrand from "./AuthBrand";
import { safeNext } from "@/lib/safeNext";
import { signIn } from "next-auth/react";
import OAuthButtons, { type OAuthAvailable } from "./OAuthButtons";

export default function RegisterForm({ oauth }: { oauth: OAuthAvailable }) {
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
    const payload = { name: f.get("name"), email: f.get("email"), password: f.get("password"), birthdate: f.get("birthdate") || "" };
    const r = await fetch("/api/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!r.ok) {
      setBusy(false);
      setError((await r.json()).error ?? "Could not register.");
      return;
    }
    await signIn("credentials", { email: payload.email, password: payload.password, redirect: false });
    window.location.href = safeNext(new URLSearchParams(window.location.search).get("next"));
  }

  const cls = "rounded-lg border border-slate-300 bg-white px-3 py-2";
  return (
    <main className="mx-auto max-w-sm px-6 py-20">
      <AuthBrand />
      <h1 className="mb-6 text-2xl font-semibold">Create your space 🌿</h1>
      <OAuthButtons available={oauth} />
      <form onSubmit={onSubmit} method="post" className="mt-1 flex flex-col gap-3">
        <input name="name" required placeholder="What should I call you?" className={cls} />
        <input name="email" type="email" required placeholder="Email" className={cls} />
        <input name="password" type="password" required minLength={8} placeholder="Password (8+ characters)" className={cls} />
        <label className="text-sm text-slate-600">Birthday (optional, for astrology)
          <input name="birthdate" type="date" className={`${cls} mt-1 w-full`} />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={busy} className="rounded-lg bg-indigo-600 py-2 text-white hover:bg-indigo-700 disabled:opacity-60">{busy ? "Creating…" : "Sign up"}</button>
      </form>
      <p className="mt-4 text-sm text-slate-600">Already have an account? <Link href={`/login${q}`} className="text-indigo-600 underline">Log in</Link></p>
    </main>
  );
}
