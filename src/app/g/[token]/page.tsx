import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { CritterStage } from "@/components/critter/CritterStage";
import { photoSrc } from "@/lib/critter/photos";
import { giftHeadline, giftLine, GIFT_UI, PHRASES, isGiftPhrase } from "@/lib/gift/gifts";
import { getGiftByToken, markOpened } from "@/lib/gift/server";

// Public page a friend opens: "小明送你一只考拉：抱抱 🐨", with two ways in:
// send one back (the loop that spreads it), or see which buddy they are today.
// No login needed to view. Shows only the sender's display name, message and photo.

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const g = await getGiftByToken((await params).token);
  if (!g) return { title: "Calmly" };
  const title = giftLine(g);
  return {
    title,
    description: "Calmly",
    robots: { index: false, follow: false },
    openGraph: { title, images: [{ url: photoSrc(g.photoId) }] },
  };
}

export default async function GiftReceived({ params }: Props) {
  const { token } = await params;
  const g = await getGiftByToken(token);
  if (!g) notFound();
  const session = await auth();
  const isSender = session?.user?.id === g.senderId;
  if (!isSender) await markOpened(g.id);

  const t = GIFT_UI[g.lang];
  const loggedIn = !!session?.user;
  const via = (path: string) => (loggedIn ? path : `/register?next=${encodeURIComponent(path)}`);
  const motion = isGiftPhrase(g.phrase) ? PHRASES[g.phrase].motion : "happy";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-6 py-10 text-center" lang={g.lang}>
      <p className="text-sm font-semibold text-slate-500">🌿 Calmly</p>
      <h1 className="text-2xl font-semibold leading-snug text-slate-800">
        {giftHeadline(g.senderName, g.photoId, g.lang)}
        {g.lang === "zh" ? "：" : ": "}
        <span className="text-indigo-700">{g.message}</span>
      </h1>
      {g.toName && <p className="-mt-3 text-sm text-slate-500">{t.forYou(g.toName)}</p>}
      <div className="w-64">
        <CritterStage sceneId={`feel_${motion}`} photoId={g.photoId} label={giftHeadline(g.senderName, g.photoId, g.lang)} caption={g.message} lang={g.lang} playKey={0} paused={false} />
      </div>
      <div className="flex w-full flex-col gap-2">
        {!isSender && (
          <Link href={via(`/gift?reply=${token}`)} className="rounded-xl bg-indigo-600 px-4 py-3 font-medium text-white hover:bg-indigo-700">
            🎁 {t.sendBack}
          </Link>
        )}
        <Link href={via("/chat")} className="rounded-xl bg-white px-4 py-3 font-medium text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50">
          {t.seeMine}
        </Link>
        {!loggedIn && (
          <p className="text-xs text-slate-400">
            {g.lang === "zh" ? "已有账号？" : "Have an account? "}
            <Link href={`/login?next=${encodeURIComponent(`/gift?reply=${token}`)}`} className="underline">{g.lang === "zh" ? "登录" : "Log in"}</Link>
          </p>
        )}
      </div>
    </main>
  );
}
