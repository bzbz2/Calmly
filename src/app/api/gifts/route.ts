import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { cleanText, giftMessage, GIFT_PHRASES, GIFTS_PER_DAY, isPhotoId, MAX_CUSTOM, MAX_NAME } from "@/lib/gift/gifts";
import { createGift, getGiftByToken, giftsSentToday, recentGifts } from "@/lib/gift/server";

// Send a buddy to a friend. The friend sees only the sender's display name, the
// message and the photo, at an unguessable /g/<token> link.

const body = z.object({
  phrase: z.enum(GIFT_PHRASES),
  custom: z.string().max(200).optional(),
  photoId: z.string().refine(isPhotoId, "unknown photo"),
  toName: z.string().max(100).optional(),
  lang: z.enum(["en", "zh"]),
  replyTo: z.string().max(64).optional(), // token of the gift being answered
});

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // Sending needs a real account (the friend sees your name); guests are asked to sign up.
  if (session.user.guest) return NextResponse.json({ error: "account" }, { status: 403 });
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid gift" }, { status: 400 });
  const d = parsed.data;

  const message = giftMessage(d.phrase, d.lang, d.custom);
  if (!message) return NextResponse.json({ error: "empty" }, { status: 400 });
  if (d.phrase === "custom" && message.length > MAX_CUSTOM) return NextResponse.json({ error: "Too long" }, { status: 400 });
  if ((await giftsSentToday(userId)) >= GIFTS_PER_DAY) return NextResponse.json({ error: "limit" }, { status: 429 });

  const replied = d.replyTo ? await getGiftByToken(d.replyTo) : null;
  const token = await createGift({
    senderId: userId,
    senderName: cleanText(session.user?.name, MAX_NAME),
    toName: cleanText(d.toName, MAX_NAME) || null,
    phrase: d.phrase,
    message,
    photoId: d.photoId as Parameters<typeof createGift>[0]["photoId"],
    lang: d.lang,
    replyTo: replied?.id ?? null,
  });
  return NextResponse.json({ token, path: `/g/${token}` });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ gifts: await recentGifts(session.user.id) });
}
