// Quick replies under Calmly's answer, matched to the current feeling. Each sends a
// plain message that the agent already knows how to handle (breathing_exercise,
// cbt_reframe, food_therapy, tarot_reading tools, or a drafting/listening request).

import type { Feeling, Lang } from "../critter/catalog";

export type QuickReply = { id: string; label: string; send: string };

const R: Record<string, Record<Lang, { label: string; send: string }>> = {
  breathe: {
    en: { label: "🫁 Breathe with me", send: "Can you guide me through a short breathing exercise?" },
    zh: { label: "🫁 陪我呼吸一下", send: "可以带我做一个简短的呼吸练习吗？" },
  },
  sort: {
    en: { label: "🧩 Help me sort this", send: "Can you help me break this down into one small next step?" },
    zh: { label: "🧩 帮我理一理", send: "能帮我把这件事拆成一个小小的下一步吗？" },
  },
  say: {
    en: { label: "🗣️ Help me say it", send: "Can you help me put into words, calmly, what I want to say to them?" },
    zh: { label: "🗣️ 帮我说出来", send: "能帮我把想对对方说的话，平静地组织一下吗？" },
  },
  reset: {
    en: { label: "🔋 Tiny reset", send: "Give me a 2-minute reset I can do right now." },
    zh: { label: "🔋 两分钟小重启", send: "给我一个现在就能做的两分钟小重启。" },
  },
  listen: {
    en: { label: "🤍 Just listen", send: "I don't need advice right now. I just want to be heard." },
    zh: { label: "🤍 听我说就好", send: "我现在不需要建议，只想有人听我说。" },
  },
  food: {
    en: { label: "🍵 Comfort food", send: "What's a comforting food or drink for how I feel right now?" },
    zh: { label: "🍵 吃点什么好", send: "我现在这种心情，吃点或喝点什么会舒服一些？" },
  },
  reframe: {
    en: { label: "🔄 Reframe it", send: "Can you help me look at this from a different angle?" },
    zh: { label: "🔄 换个角度", send: "能帮我换个角度看这件事吗？" },
  },
  savor: {
    en: { label: "✨ Savor it", send: "Help me savor this moment a little longer." },
    zh: { label: "✨ 多留一会儿", send: "帮我把这个好时刻多留一会儿。" },
  },
  tarot: {
    en: { label: "🔮 Tarot for fun", send: "Pull a tarot card for me, just for fun." },
    zh: { label: "🔮 抽张塔罗", send: "帮我抽一张塔罗牌，就当好玩。" },
  },
};

const BY_FEELING: Record<Feeling, string[]> = {
  anxious: ["breathe", "reframe"],
  on_edge: ["breathe", "reframe"],
  scared: ["breathe", "listen"],
  shocked: ["breathe", "listen"],
  overwhelmed: ["breathe", "sort"],
  wronged: ["say", "listen"],
  indignant: ["say", "breathe"],
  furious: ["breathe", "say"],
  jealous: ["reframe", "say"],
  tired: ["reset", "food"],
  dejected: ["reset", "listen"],
  bored: ["reset", "tarot"],
  sad: ["listen", "food"],
  lonely: ["listen", "food"],
  forlorn: ["listen", "food"],
  wistful: ["listen", "savor"],
  regret: ["reframe", "listen"],
  confused: ["reframe", "sort"],
  baffled: ["reframe", "listen"],
  torn: ["reframe", "sort"],
  mixed: ["listen", "reframe"],
  disgusted: ["reframe", "breathe"],
  stunned: ["listen", "breathe"],
  surprised: ["savor", "listen"],
  relieved: ["savor", "tarot"],
  calm: ["savor", "tarot"],
  relaxed: ["savor", "tarot"],
  happy: ["savor", "tarot"],
  elated: ["savor", "tarot"],
};

export function quickReplies(feeling: Feeling, lang: Lang): QuickReply[] {
  return BY_FEELING[feeling].map((id) => ({ id, ...R[id][lang] }));
}
