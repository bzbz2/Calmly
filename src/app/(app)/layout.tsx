import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { GIFT_UI } from "@/lib/gift/gifts";
import { getLastMood } from "@/lib/personal/server";
import { requestLang } from "@/lib/i18n";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  // Same language the user chats in, else the browser's.
  const lang = (session.user.id ? (await getLastMood(session.user.id))?.lang : undefined) ?? (await requestLang());
  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-4">
      <header className="flex items-center justify-between gap-3 py-4">
        <span className="whitespace-nowrap text-base font-semibold sm:text-lg">🌿 Calmly</span>
        <nav className="flex items-center gap-2.5 whitespace-nowrap text-xs sm:gap-4 sm:text-sm">
          <Link href="/chat" className="hover:underline">Chat</Link>
          <Link href="/mood" className="hover:underline">My mood</Link>
          <Link href="/gift" className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-800 ring-1 ring-amber-200 hover:bg-amber-100">{GIFT_UI[lang].nav}</Link>
          <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
            <button className="text-slate-500 hover:underline">Log out</button>
          </form>
        </nav>
      </header>
      <div className="flex-1 pb-6">{children}</div>
    </div>
  );
}
