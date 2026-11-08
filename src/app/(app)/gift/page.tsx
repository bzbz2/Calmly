import { auth } from "@/auth";
import { accountOf } from "@/lib/account";
import GiftFlow from "@/components/gift/GiftFlow";
import { isGiftPhrase } from "@/lib/gift/gifts";
import { getGiftByToken } from "@/lib/gift/server";
import { requestLang } from "@/lib/i18n";
import { getLastMood } from "@/lib/personal/server";

// Send a buddy. `?reply=<token>` = sending one back to whoever sent that gift.
// `?phrase=hug` preselects a phrase.

export default async function GiftPage({ searchParams }: { searchParams: Promise<{ reply?: string; phrase?: string }> }) {
  const sp = await searchParams;
  const session = await auth();
  const userId = session?.user?.id;
  const reply = sp.reply ? await getGiftByToken(sp.reply) : null;
  const replyTo = reply && reply.senderId !== userId ? { token: sp.reply!, name: reply.senderName } : null;
  const lang = replyTo ? reply!.lang : ((userId ? (await getLastMood(userId))?.lang : undefined) ?? (await requestLang()));
  return <GiftFlow lang={lang} myName={session?.user?.name ?? ""} replyTo={replyTo} initialPhrase={isGiftPhrase(sp.phrase) ? sp.phrase : undefined} canSend={accountOf(session) === "user"} />;
}
