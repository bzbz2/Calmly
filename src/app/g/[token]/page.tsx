import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { CritterStage } from "@/components/critter/CritterStage";
import StoryCard from "@/components/story/StoryCard";
import { accountOf } from "@/lib/account";
import { photoSrc } from "@/lib/critter/photos";
import { giftHeadline, giftLine, giftStory, GIFT_UI, PHRASES, isGiftPhrase } from "@/lib/gift/gifts";
import { getGiftByToken, markOpened } from "@/lib/gift/server";
import { signUpHref } from "@/lib/guest";

// Public page a friend opens: "小明送你一只考拉：抱抱 🐨", with two ways in:
// send one back (the loop that spreads it), or see which buddy they are today.
// No login needed to view, or to see their own buddy (that starts a guest chat). Only
// sending one needs an account, and sign-up comes straight back to the gift flow.
// Shows only the sender's display name, message and photo.

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const g = await getGiftByToken((await params).token);
  if (!g) return { title: "Calmly" };
  const title = giftLine(g);
  // Drawn-story gifts have no still image yet, so don't preview a different animal's photo.
  const images = giftStory(g.phrase) ? [] : [{ url: photoSrc(g.photoId) }];
  return {
    title,
    description: "Calmly",
    robots: { index: false, follow: false },
    openGraph: { title, images },
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
  const account = accountOf(session);
  const replyPath = `/gift?reply=${token}`;
  const motion = isGiftPhrase(g.phrase) ? PHRASES[g.phrase].motion : "happy";
  const story = giftStory(g.phrase);
  const headline = giftHeadline(g.senderName, g.photoId, g.lang, g.phrase);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-6 py-10 text-center" lang={g.lang}>
      <p className="text-sm font-semibold text-slate-500">🌿 Calmly</p>
      <h1 className="text-2xl font-semibold leading-snug text-slate-800">
        {headline}
        {g.lang === "zh" ? "：" : ": "}
        <span className="text-indigo-700">{g.message}</span>
      </h1>
      {g.toName && <p className="-mt-3 text-sm text-slate-500">{t.forYou(g.toName)}</p>}
      <div className="w-64">
        {story ? (
          <StoryCard sceneId={story} label={headline} caption="" loop={1600} replayLabel={g.lang === "zh" ? "再看一次" : "Replay"} />
        ) : (
          <CritterStage sceneId={`feel_${motion}`} photoId={g.photoId} label={headline} caption={g.message} lang={g.lang} playKey={0} paused={false} />
        )}
      </div>
      <div className="flex w-full flex-col gap-2">
        {!isSender && (
          <Link href={account === "user" ? replyPath : signUpHref(replyPath)} className="rounded-xl bg-indigo-600 px-4 py-3 font-medium text-white hover:bg-indigo-700">
            🎁 {t.sendBack}
          </Link>
        )}
        <Link href="/" className="rounded-xl bg-white px-4 py-3 font-medium text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50">
          {t.seeMine}
        </Link>
        {account !== "user" && (
          <p className="text-xs text-slate-400">
            {g.lang === "zh" ? "已有账号？" : "Have an account? "}
            <Link href={`/login?next=${encodeURIComponent(replyPath)}`} className="underline">{g.lang === "zh" ? "登录" : "Log in"}</Link>
          </p>
        )}
      </div>
    </main>
  );
}
