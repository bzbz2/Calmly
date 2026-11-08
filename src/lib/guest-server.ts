// Guest accounts, server side: create on the first message, cap messages, and fold a
// guest into a real account when they sign up or log in.

import { createHash } from "node:crypto";
import { and, count, eq, gte } from "drizzle-orm";
import { cookies } from "next/headers";
import { decode } from "next-auth/jwt";
import { conversations, db, feelingCorrections, gifts, messages, moodEntries, profiles, users } from "@/db";
import { DAY_MS, GUESTS_PER_IP_PER_DAY, mergeAnimalPrefs } from "./guest";

/** Salted hash of the client IP: enough to cap guest sign-ups, without storing the IP. */
export function ipHash(req: Request | undefined): string | null {
  const fwd = req?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req?.headers.get("x-real-ip") || "";
  if (!fwd) return null;
  return createHash("sha256").update(`${process.env.AUTH_SECRET ?? ""}:${fwd}`).digest("base64url").slice(0, 32);
}

/** A new guest user, or null if this network made too many today. */
export async function createGuest(ip: string | null): Promise<{ id: string } | null> {
  if (ip) {
    const [{ n }] = await db
      .select({ n: count() })
      .from(users)
      .where(and(eq(users.isGuest, true), eq(users.ipHash, ip), gte(users.createdAt, new Date(Date.now() - DAY_MS))));
    if (n >= GUESTS_PER_IP_PER_DAY) return null;
  }
  const [u] = await db.insert(users).values({ isGuest: true, ipHash: ip }).returning({ id: users.id });
  return u;
}

/** Messages this user sent in the last 24 hours. */
export async function messagesToday(userId: string): Promise<number> {
  const [{ n }] = await db
    .select({ n: count() })
    .from(messages)
    .where(and(eq(messages.userId, userId), eq(messages.role, "user"), gte(messages.createdAt, new Date(Date.now() - DAY_MS))));
  return n;
}

export async function isGuestUser(id: string): Promise<boolean> {
  const [u] = await db.select({ g: users.isGuest }).from(users).where(eq(users.id, id)).limit(1);
  return !!u?.g;
}

/** Turn a guest into a real account in place: same id, so all their data just stays. */
export async function upgradeGuest(id: string, fields: { email: string; name: string | null; passwordHash: string | null }) {
  const [u] = await db
    .update(users)
    .set({ ...fields, isGuest: false, ipHash: null })
    .where(and(eq(users.id, id), eq(users.isGuest, true)))
    .returning({ id: users.id });
  return !!u;
}

/**
 * Move everything a guest made into `userId` (they logged into an existing account),
 * then delete the guest. Only ever reads from a row that is still a guest.
 */
export async function mergeGuestInto(guestId: string, userId: string) {
  if (guestId === userId || !(await isGuestUser(guestId))) return;
  const [gp] = await db.select().from(profiles).where(eq(profiles.userId, guestId)).limit(1);
  const [up] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);

  const moves = [
    db.update(conversations).set({ userId }).where(eq(conversations.userId, guestId)),
    db.update(messages).set({ userId }).where(eq(messages.userId, guestId)),
    db.update(moodEntries).set({ userId }).where(eq(moodEntries.userId, guestId)),
    db.update(feelingCorrections).set({ userId }).where(eq(feelingCorrections.userId, guestId)),
    db.update(gifts).set({ senderId: userId }).where(eq(gifts.senderId, guestId)),
  ] as const;
  const profile = gp
    ? up
      ? [
          db
            .update(profiles)
            .set({ animalPrefs: mergeAnimalPrefs(up.animalPrefs, gp.animalPrefs), summary: up.summary || gp.summary, updatedAt: new Date() })
            .where(eq(profiles.userId, userId)),
        ]
      : [db.update(profiles).set({ userId }).where(eq(profiles.userId, guestId))]
    : [];
  // One HTTP batch = one transaction: all of it moves, or none of it does.
  await db.batch([...moves, ...profile, db.delete(users).where(and(eq(users.id, guestId), eq(users.isGuest, true)))]);
}

const SESSION_COOKIES = ["__Secure-authjs.session-token", "authjs.session-token"];

/** The guest id in the browser's current session cookie, if the visitor is a guest. */
export async function currentGuestId(): Promise<string | null> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  const jar = await cookies();
  for (const name of SESSION_COOKIES) {
    const raw = jar.get(name)?.value;
    if (!raw) continue;
    const t = await decode({ token: raw, secret, salt: name }).catch(() => null);
    if (t?.guest && typeof t.uid === "string") return t.uid;
  }
  return null;
}
