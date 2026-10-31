import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/chat");
  return (
    <main className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-6 py-28 text-center">
      <div className="text-5xl">🌿</div>
      <h1 className="text-4xl font-semibold">Calmly</h1>
      <p className="text-lg text-slate-600">
        Vent about your day, understand how you feel, and get gentle, personalised support — from psychology-based
        tips to tarot, astrology and food therapy. Watch your mood trend over time.
      </p>
      <div className="flex gap-3">
        <Link href="/register" className="rounded-xl bg-indigo-600 px-5 py-2.5 text-white hover:bg-indigo-700">Get started</Link>
        <Link href="/login" className="rounded-xl border border-slate-300 px-5 py-2.5 hover:bg-white">Log in</Link>
      </div>
      <p className="text-xs text-slate-500">Calmly is not a substitute for professional care. In crisis in the US? Call or text 988.</p>
    </main>
  );
}
