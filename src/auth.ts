import NextAuth from "next-auth";
import Apple from "next-auth/providers/apple";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, profiles, users } from "@/db";
import { createGuest, currentGuestId, ipHash, mergeGuestInto, upgradeGuest } from "@/lib/guest-server";

const creds = z.object({ email: z.string().email(), password: z.string().min(8) });

/** Google and Apple sign-in, each only when its keys are set (AUTH_GOOGLE_ID/SECRET, AUTH_APPLE_ID/SECRET). */
export const OAUTH = {
  apple: !!(process.env.AUTH_APPLE_ID && process.env.AUTH_APPLE_SECRET),
  google: !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
};

/** The account for a Google/Apple email: existing, the visitor's guest upgraded in place, or new. */
async function oauthUser(email: string, name: string | null, guestId: string | null): Promise<string> {
  const [u] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (u) {
    if (guestId) await mergeGuestInto(guestId, u.id);
    return u.id;
  }
  if (guestId && (await upgradeGuest(guestId, { email, name, passwordHash: null }))) return guestId;
  const [created] = await db.insert(users).values({ email, name }).returning({ id: users.id });
  await db.insert(profiles).values({ userId: created.id }).onConflictDoNothing();
  return created.id;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    // A first-time visitor gets a guest account on their first message: no form, no email.
    Credentials({
      id: "guest",
      name: "Guest",
      credentials: {},
      async authorize(_raw, request) {
        const g = await createGuest(ipHash(request));
        return g ? { id: g.id, name: null, guest: true } : null;
      },
    }),
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = creds.safeParse(raw);
        if (!parsed.success) return null;
        const email = parsed.data.email.toLowerCase();
        const [u] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (!u?.passwordHash) return null;
        const ok = await bcrypt.compare(parsed.data.password, u.passwordHash);
        return ok ? { id: u.id, email: u.email, name: u.name } : null;
      },
    }),
    ...(OAUTH.google ? [Google] : []),
    ...(OAUTH.apple ? [Apple] : []),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (!user) return token;
      if (account?.provider === "guest") {
        token.uid = user.id;
        token.guest = true;
        return token;
      }
      // Signing in on top of a guest session: keep what the guest made.
      const guestId = await currentGuestId();
      if (account?.provider === "google" || account?.provider === "apple") {
        const email = user.email?.toLowerCase();
        if (!email) throw new Error("No email from provider");
        token.uid = await oauthUser(email, user.name ?? null, guestId);
      } else {
        token.uid = user.id;
        if (guestId && user.id) await mergeGuestInto(guestId, user.id);
      }
      token.guest = false;
      return token;
    },
    session({ session, token }) {
      if (token.uid) session.user.id = token.uid as string;
      session.user.guest = !!token.guest;
      return session;
    },
  },
});
