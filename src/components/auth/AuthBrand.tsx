import Link from "next/link";

/** Who we are, for people landing on an auth page straight from a shared link. */
export default function AuthBrand() {
  return (
    <div className="mb-8">
      <Link href="/" className="text-lg font-semibold">🌿 Calmly</Link>
      <p className="mt-1 text-sm text-slate-500">A gentle space to unwind — vent about your day, meet a little mood buddy, and watch your week get calmer.</p>
    </div>
  );
}
