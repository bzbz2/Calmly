import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-4">
      <header className="flex items-center justify-between py-4">
        <span className="text-lg font-semibold">🌿 Calmly</span>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/chat" className="hover:underline">Chat</Link>
          <Link href="/mood" className="hover:underline">My mood</Link>
          <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
            <button className="text-slate-500 hover:underline">Log out</button>
          </form>
        </nav>
      </header>
      <div className="flex-1 pb-6">{children}</div>
    </div>
  );
}
