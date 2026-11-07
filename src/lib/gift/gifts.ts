// "Send a buddy" (送一只): pick a phrase, Calmly pairs it with a fitting animal photo,
// and the friend gets a link: "小明送你一只考拉：抱抱 🐨". This is about caring for
// someone else, so the buddy comes from the phrase, never from the sender's own mood.

import type { Feeling, Lang } from "../critter/catalog";
import { PHOTOS, type PhotoId } from "../critter/photos";
import { animalEmoji, animalName, animalOf } from "../personal/animals";

export const GIFT_PHRASES = ["miss", "cheer", "hug", "rest", "birthday", "custom"] as const;
export type GiftPhrase = (typeof GIFT_PHRASES)[number];

type PhraseInfo = { emoji: string; text: Record<Lang, string>; photos: PhotoId[]; motion: Feeling };

/** First photo is the default; "Another animal" cycles the rest. */
export const PHRASES: Record<GiftPhrase, PhraseInfo> = {
  miss: { emoji: "💌", text: { en: "Miss you", zh: "想你了" }, photos: ["husky-pup", "puppy-sand", "redpanda-curious", "persian-white"], motion: "wistful" },
  cheer: { emoji: "💪", text: { en: "You've got this", zh: "加油" }, photos: ["corgi-snow", "papillon-run", "sheepdog-run", "meerkat-stare"], motion: "elated" },
  hug: { emoji: "🤗", text: { en: "Hugs", zh: "抱抱" }, photos: ["koala-yawn", "panda-log", "otter-float", "kitten-blanket"], motion: "relaxed" },
  rest: { emoji: "🍵", text: { en: "You've worked so hard", zh: "辛苦了" }, photos: ["capybara-tray", "dog-nap", "fold-eyesclosed", "otter-float"], motion: "relieved" },
  birthday: { emoji: "🎂", text: { en: "Happy birthday", zh: "生日快乐" }, photos: ["samoyed-smile", "quokka-hold", "shiba-smile", "corgi-snow"], motion: "elated" },
  custom: { emoji: "✍️", text: { en: "Write your own", zh: "自己写" }, photos: ["quokka-hold", "samoyed-smile", "capybara-front", "redpanda-curious", "shiba-squint"], motion: "happy" },
};

export const isGiftPhrase = (x: unknown): x is GiftPhrase => typeof x === "string" && (GIFT_PHRASES as readonly string[]).includes(x);
export const isPhotoId = (x: unknown): x is PhotoId => typeof x === "string" && x in PHOTOS;

export const MAX_CUSTOM = 40;
export const MAX_NAME = 20;

/** Clean free text from a sender: one line, no links, no control characters, short. */
export function cleanText(raw: unknown, max: number): string {
  if (typeof raw !== "string") return "";
  return raw
    .replace(/[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e]/g, " ")
    .replace(/(https?:\/\/|www\.)\S+/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max)
    .trim();
}

/** The message on the card: the preset phrase in the gift's language, or the sender's own words. */
export function giftMessage(phrase: GiftPhrase, lang: Lang, custom?: string): string {
  if (phrase === "custom") return cleanText(custom, MAX_CUSTOM);
  return PHRASES[phrase].text[lang];
}

/** Photo for a phrase; `turn` cycles through the phrase's photos. */
export function giftPhoto(phrase: GiftPhrase, turn = 0): PhotoId {
  const list = PHRASES[phrase].photos;
  return list[((turn % list.length) + list.length) % list.length];
}

/** "小明送你一只考拉" / "Ming sent you a koala". */
export function giftHeadline(senderName: string, photoId: PhotoId, lang: Lang): string {
  const animal = animalOf(photoId);
  const name = animalName(animal, lang);
  const who = senderName.trim() || (lang === "zh" ? "一位朋友" : "A friend");
  if (lang === "zh") return `${who}送你一只${name}`;
  return `${who} sent you ${/^[aeiou]/i.test(name) ? "an" : "a"} ${name}`;
}

/** The full line shown to the friend: "小明送你一只考拉：抱抱 🐨". */
export function giftLine(g: { senderName: string; photoId: PhotoId; message: string; lang: Lang }): string {
  const sep = g.lang === "zh" ? "：" : ": ";
  return `${giftHeadline(g.senderName, g.photoId, g.lang)}${sep}${g.message} ${animalEmoji(animalOf(g.photoId))}`;
}

export const GIFTS_PER_DAY = 30;

export const GIFT_UI = {
  en: {
    nav: "Send a buddy 🎁",
    title: "Send a buddy 🎁",
    sub: "Pick what you want to say. I'll find an animal to say it.",
    to: "To (optional)",
    toPh: "Their name",
    customPh: "Say it your way…",
    another: "Another animal",
    create: "Create link",
    creating: "Creating…",
    ready: "Your buddy is ready. Send this link:",
    copy: "Copy link",
    copied: "Copied!",
    share: "Share",
    again: "Send another",
    sent: "Sent recently",
    opened: "Opened",
    unopened: "Not opened yet",
    replyTo: (n: string) => `Sending one back to ${n}`,
    sendBack: "Send one back",
    seeMine: "Which buddy am I today?",
    forYou: (n: string) => `For ${n}`,
    limit: "That's a lot of buddies today. Try again tomorrow.",
    empty: "Write a few words first.",
  },
  zh: {
    nav: "送一只 🎁",
    title: "送一只 buddy 🎁",
    sub: "选一句想说的话，我来配一只小动物替你说。",
    to: "送给谁（可选）",
    toPh: "TA 的名字",
    customPh: "用你自己的话说…",
    another: "换一只",
    create: "生成链接",
    creating: "生成中…",
    ready: "你的 buddy 准备好了，把链接发给 TA：",
    copy: "复制链接",
    copied: "已复制！",
    share: "分享",
    again: "再送一只",
    sent: "最近送出",
    opened: "已打开",
    unopened: "还没打开",
    replyTo: (n: string) => `回送给 ${n}`,
    sendBack: "回送一只",
    seeMine: "看看今天的我是哪只",
    forYou: (n: string) => `给 ${n}`,
    limit: "今天送得有点多啦，明天再来吧。",
    empty: "先写几个字吧。",
  },
} as const;
