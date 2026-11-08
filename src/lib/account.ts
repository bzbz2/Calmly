import type { Session } from "next-auth";

/** Who's visiting: no account yet, a guest (made on their first message), or a signed-up user. */
export type Account = "none" | "guest" | "user";

export function accountOf(session: Session | null): Account {
  if (!session?.user?.id) return "none";
  return session.user.guest ? "guest" : "user";
}
