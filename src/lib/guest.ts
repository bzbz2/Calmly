// Guest mode, the pure parts: limits, the "save your buddy" prompts, and merging
// profile data when a guest signs up or logs in. Server code lives in guest-server.ts.

import type { Lang } from "./critter/catalog";

/** Messages a guest can send in any 24 hours. Signing up removes the limit. */
export const GUEST_DAILY_MESSAGES = 10;
/** Guest accounts one network can create per 24 hours (shared Wi-Fi gets some room). */
export const GUESTS_PER_IP_PER_DAY = 20;
export const DAY_MS = 24 * 60 * 60 * 1000;

/** Messages left today, never below 0. */
export const guestMessagesLeft = (usedToday: number) => Math.max(0, GUEST_DAILY_MESSAGES - usedToday);

/** Add two animal-preference tallies (a guest's taps carry over to the account). */
export function mergeAnimalPrefs(a: Record<string, number>, b: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = { ...a };
  for (const [k, v] of Object.entries(b)) {
    if (typeof v === "number" && Number.isFinite(v)) out[k] = (out[k] ?? 0) + v;
  }
  return out;
}

/** Where a "save" prompt sends a guest: sign-up, then straight back to `back`. */
export const signUpHref = (back: string) => `/register?next=${encodeURIComponent(back)}`;

type Prompt = { text: string; cta: string };

export const GUEST_UI: Record<
  Lang,
  { keepBuddy: Prompt; moodBanner: Prompt; shareSave: Prompt; limit: (left: number) => string; limitReached: Prompt; later: string; giftNeedsAccount: Prompt; login: string }
> = {
  en: {
    keepBuddy: { text: "Like this little one? Save it and see it again tomorrow.", cta: "Save my buddy" },
    moodBanner: { text: "Sign up so your mood history stays with you, even on a new phone.", cta: "Sign up" },
    shareSave: { text: "Want to keep today's you? Sign up to save it.", cta: "Sign up" },
    limit: (left) => (left === 1 ? "1 free message left today." : `${left} free messages left today.`),
    limitReached: { text: "That's today's 10 free messages. Sign up to keep talking, it's free.", cta: "Sign up" },
    later: "Later",
    giftNeedsAccount: { text: "Sign up to send it. You'll come right back here.", cta: "Sign up to send" },
    login: "Log in",
  },
  zh: {
    keepBuddy: { text: "喜欢这只小家伙吗？保存下来，明天还能看到它。", cta: "保存我的小伙伴" },
    moodBanner: { text: "登录后，换手机也不会丢失记录。", cta: "注册" },
    shareSave: { text: "想留住今天的自己？注册就能保存下来。", cta: "注册" },
    limit: (left) => `今天还能免费发 ${left} 条消息。`,
    limitReached: { text: "今天的 10 条免费消息用完了。注册后可以继续聊，免费的。", cta: "注册" },
    later: "以后再说",
    giftNeedsAccount: { text: "注册后就能发送，完成后会回到这里。", cta: "注册并发送" },
    login: "登录",
  },
};
