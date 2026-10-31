"use client";
import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function Register() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

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
    window.location.href = "/chat";
  }

  const cls = "rounded-lg border border-slate-300 bg-white px-3 py-2";
  return (
    <main className="mx-auto max-w-sm px-6 py-20">
      <h1 className="mb-6 text-2xl font-semibold">Create your space 🌿</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input name="name" required placeholder="What should I call you?" className={cls} />
        <input name="email" type="email" required placeholder="Email" className={cls} />
        <input name="password" type="password" required minLength={8} placeholder="Password (8+ characters)" className={cls} />
        <label className="text-sm text-slate-600">Birthday (optional, for astrology)
          <input name="birthdate" type="date" className={`${cls} mt-1 w-full`} />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={busy} className="rounded-lg bg-indigo-600 py-2 text-white hover:bg-indigo-700 disabled:opacity-60">{busy ? "Creating…" : "Sign up"}</button>
      </form>
      <p className="mt-4 text-sm text-slate-600">Already have an account? <Link href="/login" className="text-indigo-600 underline">Log in</Link></p>
    </main>
  );
}
