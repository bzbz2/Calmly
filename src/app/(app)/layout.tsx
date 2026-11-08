import Link from "next/link";
import { auth, signOut } from "@/auth";
import { accountOf } from "@/lib/account";
import { GIFT_UI } from "@/lib/gift/gifts";
import { GUEST_UI } from "@/lib/guest";
import { getLastMood } from "@/lib/personal/server";
import { requestLang } from "@/lib/i18n";

// No sign-in wall: a first-time visitor lands in the chat and becomes a guest on their
// first message. "Log in" is a small link for people who already have an account.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const account = accountOf(session);
  const lang = (session?.user?.id ? (await getLastMood(session.user.id))?.lang : undefined) ?? (await requestLang());
  const login = (
    <Link href="/login" className="text-slate-500 hover:text-slate-700 hover:underline">
      {GUEST_UI[lang].login}
    </Link>
  );
  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-4">
      <header className="flex items-center justify-between gap-3 py-4">
        <Link href="/" className="whitespace-nowrap text-base font-semibold sm:text-lg">🌿 Calmly</Link>
        <nav className="flex items-center gap-2.5 whitespace-nowrap text-xs sm:gap-4 sm:text-sm">
          {account !== "none" && (
            <>
              <Link href="/chat" className="hover:underline">Chat</Link>
              <Link href="/mood" className="hover:underline">My mood</Link>
              <Link href="/gift" className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-800 ring-1 ring-amber-200 hover:bg-amber-100">{GIFT_UI[lang].nav}</Link>
            </>
          )}
          {account === "user" ? (
            <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
              <button className="text-slate-500 hover:underline">Log out</button>
            </form>
          ) : (
            login
          )}
        </nav>
      </header>
      <div className="flex-1 pb-6">{children}</div>
      {account === "none" && (
        <p className="pb-4 text-center text-[11px] text-slate-400">Calmly is not a substitute for professional care. In crisis in the US? Call or text 988.</p>
      )}
    </div>
  );
}
