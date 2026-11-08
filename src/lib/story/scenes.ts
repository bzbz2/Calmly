// Story scenes: 1–2 second animated mini-stories.
//   everyday trigger → the animal's reaction → a small unexpected twist
// This file is the catalog (pure data, shared by the server and the client). The art
// and timing live in src/components/story/scenes/.

import type { Feeling } from "../critter/catalog";

export const TRIGGERS = ["workload", "calendar", "meetings", "email", "people", "rest", "uncertainty", "lost", "tiny_win", "monday", "tidying", "other"] as const;
export type Trigger = (typeof TRIGGERS)[number];

export const STYLES = ["rant", "deadpan", "self_deprecating", "anxious_spiral", "quiet_sad", "masking", "proud", "relieved", "sincere"] as const;
export type Style = (typeof STYLES)[number];

export type SceneValence = "negative" | "positive" | "neutral";
export type Character = "hamster" | "cat" | "dog" | "penguin";

export type StoryScene = {
  id: string;
  character: Character;
  valence: SceneValence;
  feelings: Feeling[];
  triggers: Trigger[];
  styles: Style[];
  durationMs: number;
  /** One line for the LLM: the story and when it fits. */
  use: string;
  /** Short first-person caption; the animation must read without it. */
  caption: { en: string; zh: string };
};

const s = (x: StoryScene) => x;

export const STORY_SCENES = [
  // A. Work meltdown: this is too much.
  s({
    id: "todo_grows", character: "hamster", valence: "negative", feelings: ["overwhelmed", "tired"], triggers: ["workload"], styles: ["rant", "self_deprecating"], durationMs: 2200,
    use: "Hamster holds a to-do list that unrolls all the way to the floor; it slowly curls into a ball. Too many tasks, brain empty.",
    caption: { en: "47 things to do. Zero brain cells.", zh: "待办 47 件，脑细胞 0 个。" },
  }),
  s({
    id: "calendar_attack", character: "cat", valence: "negative", feelings: ["overwhelmed", "on_edge"], triggers: ["calendar", "meetings"], styles: ["rant", "deadpan"], durationMs: 2300,
    use: "A calendar fires meeting blocks at the cat like a machine gun; the cat flinches and winces until it's buried under a heap of meetings, and a tiny white flag pokes out and waves. Schedule packed, calendar 'attacking'.",
    caption: { en: "My calendar is attacking me.", zh: "我的日历在攻击我。" },
  }),
  s({
    id: "one_more_meeting", character: "dog", valence: "negative", feelings: ["tired", "overwhelmed", "bored"], triggers: ["meetings"], styles: ["rant", "deadpan"], durationMs: 2500,
    use: "Dog puts on headphones for a meeting; another meeting notification pops up; it slowly pulls the headphones over its eyes. Meeting fatigue.",
    caption: { en: "One more meeting and I'm done.", zh: "再开一个会我就没了。" },
  }),
  // B. Annoyed / speechless.
  s({
    id: "people_pillow", character: "cat", valence: "negative", feelings: ["tired", "indignant", "lonely"], triggers: ["people"], styles: ["deadpan", "rant"], durationMs: 1900,
    use: "Cat smiles politely, then gently buries its face in a pillow. People are exhausting, social fatigue.",
    caption: { en: "People are exhausting.", zh: "跟人打交道好累。" },
  }),
  s({
    id: "kidding_me", character: "dog", valence: "negative", feelings: ["baffled", "indignant", "stunned", "disgusted"], triggers: ["people", "workload", "other"], styles: ["deadpan"], durationMs: 2300,
    use: "Off-screen speech bubbles keep piling up beside a shiba; its smile fades, it blinks twice, then its head snaps round and it stares at the camera, eyes half shut, as the camera pushes in. Speechless, 'are you kidding me?'. Works as a reaction GIF.",
    caption: { en: "Are you kidding me?", zh: "你在开玩笑吗？" },
  }),
  s({
    id: "everything_fine", character: "hamster", valence: "negative", feelings: ["anxious", "overwhelmed", "mixed"], triggers: ["workload", "other"], styles: ["masking", "self_deprecating"], durationMs: 2300,
    use: "A tall tower of blocks crashes down all around a smiling hamster; it doesn't move, same smile, just one sweat drop. The 'this is fine' meme: 'I'm fine, everything is fine.'",
    caption: { en: "I'm fine. Everything is fine.", zh: "我没事，一切都很好。" },
  }),
  // C. Drained.
  s({
    id: "dnd_blanket", character: "cat", valence: "negative", feelings: ["tired", "lonely", "forlorn"], triggers: ["people", "rest"], styles: ["deadpan", "sincere"], durationMs: 2000,
    use: "A fluffy blanket drops onto the deadpan cat; it becomes a round lump with only eyes and ears showing, the eyes close, one ear folds and a little crescent moon pops up (no text). Socially unavailable today.",
    caption: { en: "Socially unavailable today.", zh: "今日社交已下线。" },
  }),
  s({
    id: "brain_logoff", character: "dog", valence: "negative", feelings: ["tired", "bored", "relieved"], triggers: ["workload", "rest", "other"], styles: ["deadpan", "self_deprecating"], durationMs: 2100,
    use: "A light bulb above the dog flickers twice and goes out; the dog's eyes close and it melts into a content loaf. Brain has logged off.",
    caption: { en: "My brain has officially logged off.", zh: "大脑已正式下班。" },
  }),
  s({
    id: "vacation_suitcase", character: "hamster", valence: "negative", feelings: ["tired", "overwhelmed"], triggers: ["rest"], styles: ["self_deprecating", "rant"], durationMs: 2200,
    use: "Back from holiday in a sun hat and sunglasses, the hamster trudges in dragging its suitcase, sighs, and melts flat on top of the suitcase, glasses crooked, 'z'. More tired after the holiday; need a vacation from the vacation.",
    caption: { en: "I need a vacation from my vacation.", zh: "我需要一个假期来休息我的假期。" },
  }),
  // D. Anxious / overwhelmed brain.
  s({
    id: "what_if", character: "hamster", valence: "negative", feelings: ["anxious", "on_edge", "scared"], triggers: ["uncertainty"], styles: ["anxious_spiral"], durationMs: 2200,
    use: "One question mark appears, becomes three, and the hamster puts on a tiny hard hat. Overthinking, 'what if everything goes wrong?'.",
    caption: { en: "What if everything goes wrong?", zh: "万一全都搞砸了怎么办？" },
  }),
  s({
    id: "upside_map", character: "dog", valence: "negative", feelings: ["confused", "baffled"], triggers: ["lost", "workload"], styles: ["self_deprecating"], durationMs: 2400,
    use: "Dog marches in holding a big map, turns it round and round, getting more lost, then has an idea and flips itself upside down into a headstand, beaming. 'No idea what I'm doing', self-mocking.",
    caption: { en: "I have no idea what I'm doing.", zh: "我完全不知道自己在干嘛。" },
  }),
  s({
    id: "email_close", character: "cat", valence: "negative", feelings: ["overwhelmed", "anxious", "shocked"], triggers: ["email"], styles: ["deadpan", "anxious_spiral", "self_deprecating"], durationMs: 2300,
    use: "Cat tears open one envelope and a flood of emails shoots out and rains down until the cat is buried under a heap of mail, only its ears sticking out. Opened one email and now overwhelmed.",
    caption: { en: "I opened one email. Big mistake.", zh: "就打开了一封邮件，然后我就崩了。" },
  }),
  // E. Tiny wins.
  s({
    id: "email_sent", character: "dog", valence: "positive", feelings: ["relieved", "happy", "elated"], triggers: ["email", "tiny_win"], styles: ["proud", "relieved"], durationMs: 2300,
    use: "Dog hovers a trembling paw over a big Send button, finally presses it; a paper plane zooms away and the dog lets out a huge sigh and melts into a happy puddle. Relief after a small dreaded task.",
    caption: { en: "I finally sent that email.", zh: "那封邮件我终于发出去了。" },
  }),
  s({
    id: "survived_monday", character: "cat", valence: "positive", feelings: ["relieved", "happy", "elated"], triggers: ["monday", "tiny_win", "workload"], styles: ["proud", "relieved"], durationMs: 2300,
    use: "A paw waves weakly from a heap of Monday paperwork; the cat crawls out frazzled, shakes it off, climbs on top of the pile and a gold crown drops on its head. Survived Monday / got through a hard day.",
    caption: { en: "I survived Monday.", zh: "我熬过了周一。" },
  }),
  s({
    id: "life_together", character: "hamster", valence: "positive", feelings: ["happy", "relieved", "calm", "relaxed"], triggers: ["tidying", "tiny_win"], styles: ["proud", "self_deprecating"], durationMs: 2300,
    use: "Hamster straightens one item, nods happily, then something else falls over next to it. Got my life together (sort of).",
    caption: { en: "Today I actually got my life together.", zh: "今天我真的把生活理顺了（大概）。" },
  }),
  // Extra stories from the brief.
  s({
    id: "files_double", character: "hamster", valence: "negative", feelings: ["overwhelmed", "indignant", "wronged", "tired", "furious"], triggers: ["workload", "people"], styles: ["rant", "self_deprecating"], durationMs: 2400,
    use: "Hamster balances a pile of papers on its head; a second pile thumps down and the tower wobbles; it looks at the viewer, sweating and trembling, then the pile squashes it flat into a pancake. Work dumped on me, 'I can't take this anymore'.",
    caption: { en: "I can't take this anymore.", zh: "我真的受够了。" },
  }),
  s({
    id: "penguin_hug", character: "penguin", valence: "negative", feelings: ["sad", "lonely", "wronged", "forlorn", "dejected", "regret"], triggers: ["people", "other"], styles: ["quiet_sad", "sincere"], durationMs: 2200,
    use: "A little penguin hunches, wraps its flippers around its own belly in a hug and sheds one small tear; then a tiny heart appears, it leans into its own hug and its eyes close softly into a small smile. Quiet sadness or hurt. Gentle, never a joke.",
    caption: { en: "Just need a little hug right now.", zh: "现在只想抱抱自己。" },
  }),
  s({
    id: "cat_flatten", character: "cat", valence: "negative", feelings: ["tired", "dejected", "overwhelmed"], triggers: ["workload", "rest", "other"], styles: ["self_deprecating", "deadpan", "rant"], durationMs: 2500,
    use: "Cat sits with heavy eyelids, sighs and nods off, then suddenly flops face-down and melts into a flat pancake and stays there. Drained, deflated, done.",
    caption: { en: "Officially a pancake.", zh: "已经摊成一张猫饼了。" },
  }),
  s({
    id: "can_startle", character: "dog", valence: "negative", feelings: ["on_edge", "anxious", "scared", "shocked"], triggers: ["uncertainty", "other"], styles: ["anxious_spiral", "self_deprecating"], durationMs: 2000,
    use: "Dog picks up a can, sets it down, and is startled by its own 'clank': jumps with ears and fur up and eyes wide, then stares at the can suspiciously. Jumpy, on edge, everything makes me jump.",
    caption: { en: "Even my own noise scares me today.", zh: "今天连自己弄出的声音都能吓到我。" },
  }),
  // Motions borrowed from favourite reaction GIFs.
  s({
    id: "peek_hello", character: "hamster", valence: "positive", feelings: ["happy", "calm", "relieved", "elated"], triggers: ["tiny_win", "other"], styles: ["sincere", "relieved"], durationMs: 2500,
    use: "Two little paws grab a ledge, ears pop up, the hamster peeks over, looks around, spots you and breaks into a happy ^ ^ smile with sparkles. Quietly good mood, a shy hello. Also good as a greeting.",
    caption: { en: "Feeling kind of good today.", zh: "今天心情还不错。" },
  }),
  s({
    id: "waiting_phone", character: "penguin", valence: "negative", feelings: ["lonely", "wistful", "forlorn"], triggers: ["people", "other"], styles: ["quiet_sad", "sincere"], durationMs: 2500,
    use: "A penguin stares at a phone on the floor, glances at you, pokes the phone: the screen lights up with nothing new, goes dark, and it slowly slumps. Missing someone, waiting for a message. Gentle, never a joke.",
    caption: { en: "Still waiting for your message.", zh: "还在等你的消息。" },
  }),
  s({
    id: "message_arrives", character: "penguin", valence: "positive", feelings: ["wistful", "happy", "relieved", "elated"], triggers: ["people", "tiny_win"], styles: ["sincere", "relieved"], durationMs: 2500,
    use: "A penguin waits by a dark phone; it buzzes and lights up, a heart floats out, and the penguin hops and flaps happily. The message finally came. Also the 'Miss you' gift.",
    caption: { en: "Your message came!", zh: "等到你的消息啦！" },
  }),
  // Safe fallback for unclear input.
  s({
    id: "neutral_surprise", character: "cat", valence: "neutral", feelings: ["surprised", "stunned", "mixed"], triggers: ["other"], styles: ["sincere"], durationMs: 2200,
    use: "A big soap bubble drifts onto the cat's nose and pops; it jumps, fur puffed, looks left and right, then tilts its head under a big '?'. Neutral surprise: safe when the input could be anger or delight, or is unclear.",
    caption: { en: "Wait, what just happened?", zh: "等等，刚刚发生了什么？" },
  }),
] as const satisfies readonly StoryScene[];

export type SceneId = (typeof STORY_SCENES)[number]["id"];
export const SCENE_IDS = STORY_SCENES.map((x) => x.id) as SceneId[];
export const NEUTRAL_SCENE: SceneId = "neutral_surprise";

const BY_ID = new Map<string, StoryScene>(STORY_SCENES.map((x) => [x.id, x]));
export const sceneById = (id: string): StoryScene | undefined => BY_ID.get(id);
export const isSceneId = (x: unknown): x is SceneId => typeof x === "string" && BY_ID.has(x);
