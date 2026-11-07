// First screen of a new chat: greeting, a placeholder buddy, and 4 one-tap moods.
// A mood chip sends a short message with the feeling attached, so the buddy appears
// instantly and the user's own choice is stored (not the LLM's guess).

import type { Feeling, Lang } from "../critter/catalog";

export type MoodChip = { id: string; emoji: string; feeling: Feeling; label: string; send: string };

const CHIPS: { id: string; emoji: string; feeling: Feeling; label: Record<Lang, string>; send: Record<Lang, string> }[] = [
  { id: "tired", emoji: "😫", feeling: "tired", label: { en: "Tired", zh: "累" }, send: { en: "I'm so tired today.", zh: "今天好累。" } },
  { id: "meh", emoji: "😐", feeling: "calm", label: { en: "Meh", zh: "一般" }, send: { en: "Today's just okay.", zh: "今天一般般吧。" } },
  { id: "good", emoji: "😊", feeling: "happy", label: { en: "Good", zh: "不错" }, send: { en: "Today's pretty good!", zh: "今天还不错！" } },
  { id: "anxious", emoji: "😰", feeling: "anxious", label: { en: "Anxious", zh: "焦虑" }, send: { en: "I'm feeling anxious.", zh: "我有点焦虑。" } },
];

export function moodChips(lang: Lang): MoodChip[] {
  return CHIPS.map((c) => ({ id: c.id, emoji: c.emoji, feeling: c.feeling, label: c.label[lang], send: c.send[lang] }));
}

export function welcomeText(name: string, lang: Lang) {
  const n = name.trim();
  return lang === "zh"
    ? {
        title: n ? `嗨 ${n}，今天过得怎么样？` : "嗨，今天过得怎么样？",
        sub: "说说你的感受，看看谁会出现。",
        placeholder: "输入，或点 🎤 说话…",
        buddyLabel: "等你开口",
        buddyCaption: "我在这儿，等你说说今天。",
      }
    : {
        title: n ? `Hi ${n}, How's your day going?` : "Hi, How's your day going?",
        sub: "Tell me how you feel and see who shows up.",
        placeholder: "Type or tap 🎤 to talk…",
        buddyLabel: "waiting for you",
        buddyCaption: "I'm here. Tell me about your day.",
      };
}
