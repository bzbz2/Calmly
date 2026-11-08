// First screen of a new chat (and the home page): greeting, a looping buddy story that
// shows what you'll get, the message box, and 4 one-tap moods.
// A mood chip sends a short message with the feeling attached, so the buddy appears
// instantly and the user's own choice is stored (not the LLM's guess).

import type { Feeling, Lang } from "../critter/catalog";

export type MoodChip = { id: string; emoji: string; feeling: Feeling; label: string; send: string };

const CHIPS: { id: string; emoji: string; feeling: Feeling; label: Record<Lang, string>; send: Record<Lang, string> }[] = [
  { id: "tired", emoji: "😫", feeling: "tired", label: { en: "Exhausted", zh: "累坏了" }, send: { en: "I'm so tired today.", zh: "今天好累。" } },
  { id: "meh", emoji: "😐", feeling: "calm", label: { en: "Meh", zh: "一般" }, send: { en: "Today's just okay.", zh: "今天一般般吧。" } },
  { id: "good", emoji: "😊", feeling: "happy", label: { en: "Pretty good", zh: "还不错" }, send: { en: "Today's pretty good!", zh: "今天还不错！" } },
  { id: "anxious", emoji: "😰", feeling: "anxious", label: { en: "Anxious", zh: "焦虑" }, send: { en: "I'm feeling anxious.", zh: "我有点焦虑。" } },
];

export function moodChips(lang: Lang): MoodChip[] {
  return CHIPS.map((c) => ({ id: c.id, emoji: c.emoji, feeling: c.feeling, label: c.label[lang], send: c.send[lang] }));
}

/** The scene that loops on the first screen: hamster hugs a file, files double, it keels over. */
export const WELCOME_SCENE = "files_double" as const;

/** No name in the greeting: a guest has none, and it reads warmer without it. */
export function welcomeText(lang: Lang) {
  return lang === "zh"
    ? {
        title: "今天过得怎么样？",
        sub: "说说你的感受，看看谁会出现。",
        placeholder: "我的日历在攻击我…",
        buddyLabel: "一只小仓鼠抱着文件，文件翻倍，它倒下了",
      }
    : {
        title: "How's your day going?",
        sub: "Tell me how you feel and see who shows up.",
        placeholder: "My calendar is attacking me…",
        buddyLabel: "A hamster hugs a file, the files double, and it keels over",
      };
}
