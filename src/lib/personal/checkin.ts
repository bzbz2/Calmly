// Gentle check-in when a new chat starts: if the user's last mood was heavy, Calmly
// opens with "Last time you felt wronged about your manager. How did it go?"

import { FEELING_SCENES, type Feeling, type Lang } from "../critter/catalog";
import { isHeavy } from "./moods";

export type LastMood = { feeling: Feeling; trigger: string | null; createdAt: string | Date; lang: Lang };
export type CheckIn = { text: string; chips: { label: string; send: string }[]; lang: Lang; feeling: Feeling };

const MIN_GAP_MS = 3 * 3600_000; // just chatted? no check-in
const MAX_GAP_MS = 7 * 86_400_000; // more than a week ago? let it go

const hasCjk = (s: string) => /[㐀-鿿]/.test(s);

export function buildCheckIn(last: LastMood | null, now: Date): CheckIn | null {
  if (!last || !isHeavy(last.feeling)) return null;
  const gap = now.getTime() - new Date(last.createdAt).getTime();
  if (gap < MIN_GAP_MS || gap > MAX_GAP_MS) return null;
  const label = FEELING_SCENES[last.feeling].label[last.lang];
  const trigger = last.trigger?.trim().slice(0, 40) || null;

  if (last.lang === "zh") {
    const about = trigger && hasCjk(trigger) ? `，因为${trigger}` : "";
    const ctx = `上次我觉得${label}${about}`;
    return {
      lang: "zh",
      feeling: last.feeling,
      text: `上次你觉得${label}${about}。后来怎么样了？`,
      chips: [
        { label: "好多了", send: `${ctx}，现在好多了。` },
        { label: "还是很难", send: `${ctx}，现在还是很难受。` },
        { label: "想聊别的", send: "今天想聊点别的。" },
      ],
    };
  }
  const about = trigger && !hasCjk(trigger) ? ` about ${trigger}` : "";
  const ctx = `Last time I felt ${label}${about}`;
  return {
    lang: "en",
    feeling: last.feeling,
    text: `Last time you felt ${label}${about}. How did it go?`,
    chips: [
      { label: "Better now", send: `${ctx}. It's better now.` },
      { label: "Still rough", send: `${ctx}. It's still rough.` },
      { label: "Something else", send: "I'd like to talk about something else today." },
    ],
  };
}
