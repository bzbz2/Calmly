// Static catalog for "Express with a critter". No database table: scenes are code.
//
// Principle: the critter MIRRORS the user's own feeling. It never comforts or
// responds. Captions are first person, in the user's voice, naming the feeling.
// Captions exist in English and Chinese; the user's input language picks one.
//
// Two kinds of art:
//  - Situation scenes (e.g. meeting_fatigue): a specific mini-story.
//  - Feeling scenes (feel_*): a real animal photo whose expression fits the feeling,
//    with a 1-2s micro-motion and small overlay (see src/lib/critter/photos.ts).

export type Lang = "en" | "zh";
export type Captions = Record<Lang, string[]>;

export const SITUATIONS = ["meeting_fatigue", "task_overload", "social_battery", "unseen_effort", "tiny_victory"] as const;
export type Situation = (typeof SITUATIONS)[number];
export type MoodIntent = Situation | "general";

export const FEELINGS = [
  "tired",
  "sad",
  "wronged",
  "jealous",
  "regret",
  "dejected",
  "forlorn",
  "lonely",
  "indignant",
  "furious",
  "scared",
  "anxious",
  "on_edge",
  "shocked",
  "stunned",
  "surprised",
  "baffled",
  "confused",
  "disgusted",
  "overwhelmed",
  "torn",
  "wistful",
  "bored",
  "relieved",
  "calm",
  "relaxed",
  "happy",
  "elated",
  "mixed",
] as const;
export type Feeling = (typeof FEELINGS)[number];

export const isFeeling = (x: unknown): x is Feeling => typeof x === "string" && (FEELINGS as readonly string[]).includes(x);

export type ArtId = "meeting_fatigue" | `feel_${Feeling}`;

export type SituationScene = {
  id: Situation;
  // Feelings this situation can carry. If the user's dominant feeling is outside
  // this list, the feeling scene wins, because the art must match how they feel.
  feelings: Feeling[];
  captions: Captions;
  hasArt: boolean; // false = no dedicated scene yet; rendered via its primary feeling's art
  durationMs: number;
};

export type FeelingScene = {
  id: Feeling;
  label: Record<Lang, string>;
  captions: Captions;
  durationMs: number;
};

export const SITUATION_SCENES: Record<Situation, SituationScene> = {
  meeting_fatigue: {
    id: "meeting_fatigue",
    feelings: ["tired", "indignant", "bored"],
    captions: {
      en: [
        "Me, hearing “quick sync?” for the fifth time today.",
        "This could have been an email. So could the last four.",
        "My calendar has no room left for me.",
        "Camera on, smile on, energy… gone.",
      ],
      zh: ["今天第五次听到「快速对一下？」", "这个会，本来发封邮件就行。", "日历满了，没给我自己留一格。", "镜头开着，笑容挂着，电量……没了。"],
    },
    hasArt: true,
    durationMs: 2000,
  },
  task_overload: {
    id: "task_overload",
    feelings: ["overwhelmed", "anxious", "tired"],
    captions: {
      en: ["Just one more thing… said everyone, all day.", "My to-do list grows faster than I can breathe.", "I'm doing my best, and the pile is still winning."],
      zh: ["就一件事……每个人都这么说。", "待办清单长得比我喘气还快。", "我已经尽力了，可那堆事还在赢。"],
    },
    hasArt: false,
    durationMs: 2000,
  },
  social_battery: {
    id: "social_battery",
    feelings: ["tired"],
    captions: {
      en: ["Social battery: 1%. Please let me recharge.", "I like people. I'm just all out of people today.", "I need quiet more than I can explain."],
      zh: ["社交电量 1%，请让我充会儿电。", "我喜欢大家，只是今天的额度用完了。", "我比任何时候都需要安静。"],
    },
    hasArt: false,
    durationMs: 2000,
  },
  unseen_effort: {
    id: "unseen_effort",
    feelings: ["wronged", "sad", "indignant", "lonely", "dejected"],
    captions: {
      en: ["I worked so hard and nobody even noticed.", "Pouring my heart in, hearing nothing back.", "I just want someone to see how much I'm carrying."],
      zh: ["我那么努力，却没人看见。", "全心全意投入，换来一片安静。", "只想有人看见我扛了多少。"],
    },
    hasArt: false,
    durationMs: 2000,
  },
  tiny_victory: {
    id: "tiny_victory",
    feelings: ["happy", "elated", "relieved"],
    captions: {
      en: ["I actually did it, and I'm letting myself be proud.", "Small win? Not to me.", "Finally. I needed this one."],
      zh: ["我做到了，我允许自己骄傲一下。", "小胜利？对我来说可不小。", "终于！这次我太需要了。"],
    },
    hasArt: false,
    durationMs: 2000,
  },
};

const scene = (id: Feeling, en: string, zh: string, captions: Captions, durationMs = 2000): FeelingScene => ({
  id,
  label: { en, zh },
  captions,
  durationMs,
});

export const FEELING_SCENES: Record<Feeling, FeelingScene> = {
  tired: scene(
    "tired",
    "tired",
    "累",
    {
      en: ["Running on fumes, still showing up.", "My battery is at 2% and there's no charger in sight.", "So tired even my tiredness is tired."],
      zh: ["电量 2%，还在硬撑。", "身体在上班，灵魂在补觉。", "累到连叹气都没力气了。"],
    },
  ),
  sad: scene(
    "sad",
    "sad",
    "难过",
    {
      en: ["Some days are just heavier than others.", "I'm trying to hold it together, and it's hard.", "There's a little cloud that won't stop following me."],
      zh: ["有些日子就是比较重。", "我在努力撑着，真的有点难。", "心里下了一场小雨，一直没停。"],
    },
  ),
  wronged: scene(
    "wronged",
    "wronged",
    "委屈",
    {
      en: ["I didn't do anything wrong, and somehow it's on me.", "Holding back tears because it just isn't fair.", "I want to explain, but the words keep getting stuck."],
      zh: ["明明不是我的错，却要我来扛。", "嘴上说没事，眼泪在打转。", "想解释，话到嘴边又咽回去了。"],
    },
  ),
  jealous: scene(
    "jealous",
    "jealous",
    "吃醋",
    {
      en: ["I'm not jealous. I'm just… watching. Closely.", "Happy for them. Also a little bit sour.", "Why does that sting more than it should?"],
      zh: ["我才没吃醋，只是……多看了两眼。", "替他们高兴，心里却有点酸。", "这醋坛子，好像打翻了。"],
    },
  ),
  regret: scene(
    "regret",
    "regretful",
    "遗憾",
    {
      en: ["It slipped away, and I keep looking at where it was.", "If only I'd said something sooner.", "I can't go back, but part of me keeps trying."],
      zh: ["就差那么一点点。", "要是当时勇敢一点就好了。", "明知回不去，还是忍不住回头看。"],
    },
  ),
  dejected: scene(
    "dejected",
    "dejected",
    "沮丧",
    {
      en: ["I tried, and it still didn't work out.", "All the air just went out of me.", "Back to square one, and my heart knows it."],
      zh: ["努力了，还是没成。", "一下子泄了气。", "像被浇了一盆冷水。"],
    },
  ),
  forlorn: scene(
    "forlorn",
    "forlorn",
    "落寞",
    {
      en: ["Everything got quiet, and so did I.", "The leaves fall, and nobody's here to see it but me.", "A little faded around the edges today."],
      zh: ["热闹散了，只剩我自己。", "风一吹，心里空空的。", "今天的我，有点褪色。"],
    },
  ),
  lonely: scene(
    "lonely",
    "lonely",
    "孤单",
    {
      en: ["Wishing someone would ask how I'm really doing.", "Even in a crowd, I feel a little alone.", "I miss feeling close to someone."],
      zh: ["好想有人问问我，最近真的还好吗。", "人群里，我还是有点孤单。", "好想和谁靠近一点。"],
    },
  ),
  indignant: scene(
    "indignant",
    "indignant",
    "愤愤不平",
    {
      en: ["I'm trying so hard to stay calm right now.", "Deep breath. Another one. Still so frustrated.", "That wasn't fair, and I'm not over it."],
      zh: ["越想越气，凭什么啊。", "我在努力冷静，但真的不服。", "这口气，我咽不下去。"],
    },
  ),
  furious: scene(
    "furious",
    "furious",
    "暴跳如雷",
    {
      en: ["I'm SO angry I could stomp a hole in the floor.", "Steam level: maximum.", "I need at least five minutes before I can talk."],
      zh: ["气到原地跺脚！", "火已经冒到头顶了。", "别跟我说话，我要炸了。"],
    },
  ),
  scared: scene(
    "scared",
    "scared",
    "恐惧",
    {
      en: ["I'm scared, and I can't make it stop.", "Part of me wants to hide until it's over.", "Peeking out from behind my hands."],
      zh: ["好害怕，想把自己藏起来。", "捂住眼睛，好像就不会发生。", "心里一直在发抖。"],
    },
  ),
  anxious: scene(
    "anxious",
    "uneasy",
    "忐忑不安",
    {
      en: ["My mind has 47 tabs open and they're all buzzing.", "Everything feels one step away from going wrong.", "Heart racing, thoughts racing, me just trying to breathe."],
      zh: ["心里七上八下的。", "坐立不安，脑子停不下来。", "心怦怦跳，就是安不下心。"],
    },
  ),
  on_edge: scene(
    "on_edge",
    "on edge",
    "提心吊胆",
    {
      en: ["Waiting for the other shoe to drop.", "Holding my breath until this is over.", "Every little sound makes me jump."],
      zh: ["心一直悬着，不敢放下。", "总觉得下一秒就要出事。", "大气都不敢出。"],
    },
  ),
  shocked: scene(
    "shocked",
    "shocked",
    "大惊失色",
    {
      en: ["Wait. WHAT just happened?", "All the color just drained out of my face.", "My heart jumped right out of my chest."],
      zh: ["什么？！我没听错吧？", "吓得脸都白了。", "心脏差点跳出来。"],
    },
  ),
  stunned: scene(
    "stunned",
    "stunned",
    "目瞪口呆",
    {
      en: ["I have no words. Literally none.", "My jaw is somewhere on the floor.", "Still processing… please hold."],
      zh: ["我……说不出话来。", "下巴掉地上了。", "大脑正在加载中……"],
    },
  ),
  surprised: scene(
    "surprised",
    "surprised",
    "诧异",
    {
      en: ["Huh. Did not see that coming.", "Wait, really?", "That caught me completely off guard."],
      zh: ["咦？还有这种事？", "等等，真的吗？", "完全没想到。"],
    },
  ),
  baffled: scene(
    "baffled",
    "baffled",
    "莫名其妙",
    {
      en: ["Sorry, what? None of this makes sense.", "I've read it three times and I'm still lost.", "Tilting my head at the whole situation."],
      zh: ["这都什么跟什么啊？", "看了三遍，还是没看懂。", "一头雾水，莫名其妙。"],
    },
  ),
  confused: scene(
    "confused",
    "lost",
    "迷茫",
    {
      en: ["I don't know which way to go anymore.", "Standing in the fog, waiting for a sign.", "I used to know what I wanted. Now I'm not sure."],
      zh: ["不知道该往哪儿走。", "站在雾里，看不清前面的路。", "以前很确定的，现在都不确定了。"],
    },
  ),
  disgusted: scene(
    "disgusted",
    "grossed out",
    "嫌弃",
    {
      en: ["Ew. No. Absolutely not.", "I'm going to need that far away from me.", "That made my whole face scrunch."],
      zh: ["咦——离我远一点。", "嫌弃写在脸上了。", "看一眼都觉得多余。"],
    },
  ),
  overwhelmed: scene(
    "overwhelmed",
    "overwhelmed",
    "压力山大",
    {
      en: ["Everything, everywhere, all at once.", "It's all landing on me at the same time.", "I'm one more thing away from melting into the floor."],
      zh: ["所有事情一起砸过来了。", "再多一件，我就要融化在地上了。", "压力山大，喘不过气。"],
    },
  ),
  torn: scene(
    "torn",
    "torn",
    "患得患失",
    {
      en: ["Afraid to want it, afraid to lose it.", "It's fine. It's not fine. It's fine?", "Holding on so tight it's starting to hurt."],
      zh: ["怕得不到，又怕失去。", "好一阵，坏一阵，心跟着晃。", "一边期待，一边害怕。"],
    },
  ),
  wistful: scene(
    "wistful",
    "wistful",
    "留恋",
    {
      en: ["I'm not ready for this to be over.", "Looking back one more time before I go.", "Some moments I'd keep forever if I could."],
      zh: ["舍不得走。", "走之前，再回头看一眼。", "有些时光，真想一直留着。"],
    },
  ),
  bored: scene(
    "bored",
    "bored",
    "百无聊赖",
    {
      en: ["Watching the clock. The clock is watching back.", "So bored I'm counting ceiling tiles.", "Nothing to do, nowhere to be, nothing happening."],
      zh: ["无聊到数天花板。", "时间怎么过得这么慢。", "托着下巴，发呆中。"],
    },
  ),
  relieved: scene(
    "relieved",
    "letting go",
    "释怀",
    {
      en: ["I'm finally letting it go.", "Long breath out. It's okay now.", "It doesn't sting the way it used to."],
      zh: ["终于放下了。", "长长地呼一口气，没事了。", "想通了，心也就轻了。"],
    },
  ),
  calm: scene(
    "calm",
    "calm",
    "心如止水",
    {
      en: ["Still water. Quiet mind.", "Nothing to chase right now.", "Breathing in, breathing out, and that's enough."],
      zh: ["此刻什么都不用追。", "不急，不慌，刚刚好。", "呼吸之间，一切平静。"],
    },
  ),
  relaxed: scene(
    "relaxed",
    "relaxed",
    "松弛",
    {
      en: ["Fully melted. Do not disturb.", "No plans, no pressure, just vibes.", "My shoulders finally dropped."],
      zh: ["整个人松下来了。", "不赶时间，慢慢来。", "躺平一会儿，真舒服。"],
    },
  ),
  happy: scene(
    "happy",
    "happy",
    "开心",
    {
      en: ["Something good happened and I'm soaking it in.", "Today, the good stuff won.", "I'm proud of me, and that feels new."],
      zh: ["有好事发生，我在好好享受。", "今天，好事赢了。", "我为自己骄傲，这感觉真好。"],
    },
  ),
  elated: scene(
    "elated",
    "overjoyed",
    "手舞足蹈",
    {
      en: ["I can't stop dancing!", "Best. Day. Ever.", "So happy my feet won't stay still."],
      zh: ["开心到手舞足蹈！", "今天是最棒的一天！", "高兴得原地转圈圈！"],
    },
  ),
  mixed: scene(
    "mixed",
    "mixed",
    "五味杂陈",
    {
      en: ["I can't quite name it, but I'm feeling it.", "There's a lot going on in here.", "Not sure what this feeling is. It's real, though."],
      zh: ["说不清是什么滋味，但我感觉到了。", "心里五味杂陈。", "乱成一团毛线。"],
    },
  ),
};

/** Feelings where we gently offer the chat as a next step. */
export const HEAVY_FEELINGS: Feeling[] = [
  "tired",
  "sad",
  "wronged",
  "jealous",
  "regret",
  "dejected",
  "forlorn",
  "lonely",
  "indignant",
  "furious",
  "scared",
  "anxious",
  "on_edge",
  "confused",
  "overwhelmed",
  "torn",
  "mixed",
];

/** Positive feelings. A tie between one of these and a heavy one reads as `mixed` (bittersweet). */
export const LIGHT_FEELINGS: Feeling[] = ["happy", "elated", "relieved", "calm", "relaxed"];
