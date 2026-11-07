// Server-only data access for gifts.

import { randomBytes } from "node:crypto";
import { and, count, desc, eq, gte, isNull } from "drizzle-orm";
import { db, gifts } from "@/db";
import type { Lang } from "../critter/catalog";
import type { PhotoId } from "../critter/photos";
import { isPhotoId, type GiftPhrase } from "./gifts";

/** 16 random bytes, URL-safe: unguessable, so links can't be enumerated. */
export const newToken = () => randomBytes(16).toString("base64url");

export type PublicGift = { id: string; senderId: string; senderName: string; toName: string | null; message: string; photoId: PhotoId; lang: Lang; phrase: string };

/** A gift for the public page. Only what the friend needs to see. */
export async function getGiftByToken(token: string): Promise<PublicGift | null> {
  if (!/^[A-Za-z0-9_-]{16,32}$/.test(token)) return null;
  const [g] = await db
    .select({ id: gifts.id, senderId: gifts.senderId, senderName: gifts.senderName, toName: gifts.toName, message: gifts.message, photoId: gifts.photoId, lang: gifts.lang, phrase: gifts.phrase })
    .from(gifts)
    .where(eq(gifts.token, token))
    .limit(1);
  if (!g || !isPhotoId(g.photoId)) return null;
  return { ...g, photoId: g.photoId, lang: g.lang === "zh" ? "zh" : "en" };
}

export async function markOpened(id: string) {
  await db.update(gifts).set({ openedAt: new Date() }).where(and(eq(gifts.id, id), isNull(gifts.openedAt)));
}

export async function giftsSentToday(senderId: string) {
  const [r] = await db.select({ n: count() }).from(gifts).where(and(eq(gifts.senderId, senderId), gte(gifts.createdAt, new Date(Date.now() - 86_400_000))));
  return r?.n ?? 0;
}

export async function createGift(g: { senderId: string; senderName: string; toName: string | null; phrase: GiftPhrase; message: string; photoId: PhotoId; lang: Lang; replyTo: string | null }) {
  const token = newToken();
  await db.insert(gifts).values({ ...g, token });
  return token;
}

export async function recentGifts(senderId: string, limit = 5) {
  return db
    .select({ token: gifts.token, toName: gifts.toName, message: gifts.message, photoId: gifts.photoId, createdAt: gifts.createdAt, openedAt: gifts.openedAt })
    .from(gifts)
    .where(eq(gifts.senderId, senderId))
    .orderBy(desc(gifts.createdAt))
    .limit(limit);
}
