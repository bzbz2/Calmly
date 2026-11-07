// Pure helpers for voice chat. The audio itself uses the browser's free built-in
// Web Speech APIs (SpeechRecognition for speech-to-text, speechSynthesis for
// text-to-speech), so there are no API keys, no paid services and no new packages.

import type { Lang } from "./critter/catalog";

/** BCP-47 tags used for recognition and synthesis. */
export const SPEECH_LANG: Record<Lang, string> = { en: "en-US", zh: "zh-CN" };

/** Make a chat reply pleasant to hear: drop markdown and bullets, read links as their domain. */
export function cleanForSpeech(text: string): string {
  return text
    .replace(/\*\*|__|`|#+\s/g, "")
    .replace(/https?:\/\/(?:www\.)?([^/\s]+)\S*/g, "$1")
    .replace(/^\s*[•\-*]\s+/gm, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

/**
 * Split text into sentence-sized chunks. Chrome stops long utterances after ~15s,
 * so we queue short ones; tiny neighbours are merged to avoid choppy pauses.
 */
export function chunkForSpeech(text: string, max = 180): string[] {
  const sentences = text
    .split(/(?<=[.!?。！？；;])\s*|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const pieces: string[] = [];
  for (const s of sentences) {
    let rest = s;
    while (rest.length > max) {
      const lim = max - 1; // keep the break character inside the limit
      const cut = Math.max(rest.lastIndexOf(",", lim), rest.lastIndexOf("，", lim), rest.lastIndexOf("、", lim), rest.lastIndexOf(" ", lim));
      const at = cut > max * 0.4 ? cut + 1 : max;
      pieces.push(rest.slice(0, at).trim());
      rest = rest.slice(at).trim();
    }
    if (rest) pieces.push(rest);
  }
  const out: string[] = [];
  for (const p of pieces) {
    const last = out[out.length - 1];
    if (last && last.length + p.length + 1 <= max) out[out.length - 1] = `${last} ${p}`;
    else out.push(p);
  }
  return out;
}

export type VoiceInfo = { name: string; lang: string; localService?: boolean };

const NICE_VOICE = /natural|neural|premium|enhanced|google|samantha|siri|ting-ting|tingting|xiaoxiao|yunxi/i;

/** Best installed voice for a language, or undefined to let the browser choose. */
export function pickVoice<V extends VoiceInfo>(voices: V[], lang: Lang): V | undefined {
  const want = SPEECH_LANG[lang].toLowerCase();
  const prefix = want.split("-")[0];
  let best: V | undefined;
  let bestScore = 0;
  for (const v of voices) {
    const vl = v.lang.toLowerCase().replace("_", "-");
    if (!vl.startsWith(prefix)) continue;
    const score = (vl === want ? 3 : 1) + (NICE_VOICE.test(v.name) ? 2 : 0);
    if (score > bestScore) {
      best = v;
      bestScore = score;
    }
  }
  return best;
}

/** Default recognition language: the language of the user's last message, else the browser's. */
export function defaultVoiceLang(lastUserLang: Lang | undefined, navigatorLang: string | undefined): Lang {
  if (lastUserLang) return lastUserLang;
  return navigatorLang?.toLowerCase().startsWith("zh") ? "zh" : "en";
}
