// Deterministic mood -> critter matching. No LLM call, no network, no storage.
// Two signals:
//  1. Situation (e.g. "nobody noticed" -> unseen_effort): picks the caption story.
//  2. Feeling (tired, wronged, jealous, ...): picks the photo and its micro-motion. The art always
//     mirrors the user's own feeling and never shows a comforting response.
// English and Chinese input are both understood; captions follow the input language.

import {
  FEELING_SCENES,
  HEAVY_FEELINGS,
  LIGHT_FEELINGS,
  SITUATION_SCENES,
  type ArtId,
  type Feeling,
  type Lang,
  type MoodIntent,
} from "./catalog";
import { defaultPhoto, photo, type PhotoId } from "./photos";

export const MAX_MOOD_LENGTH = 240;
const MIN_SCORE = 3;

type Rule = { re: RegExp; w: number; negatable?: boolean };
type ScoredIntent = Exclude<MoodIntent, "general">;
type ScoredFeeling = Exclude<Feeling, "mixed">;

const RULES: Record<ScoredIntent, Rule[]> = {
  meeting_fatigue: [
    { re: /\bmeetings?\b/, w: 3 },
    { re: /\b(syncs?|standups?|stand ups?|zoom|huddles?|calls?|call after call)\b/, w: 2 },
    { re: /\b(calendar|back to back|wall to wall)\b/, w: 2 },
    { re: /\b(done with|tired of|sick of|so many|another|endless|too many|enough)\b/, w: 1 },
  ],
  task_overload: [
    { re: /\b(too much|so much) (to do|work|going on|on my plate|stuff)\b/, w: 4 },
    { re: /\bon my plate\b/, w: 2 },
    { re: /\b(overwhelm\w*|swamped|buried|drowning|snowed under|piling up|piled up|stacking up|behind on)\b/, w: 3 },
    { re: /\b(to do list|to-do list|todo list|to-dos?|todos?|backlog|workload)\b/, w: 2 },
    { re: /\b(no time|not enough time|can'?t keep up)\b/, w: 2 },
    { re: /\b(deadlines?|tasks?|emails?|inbox|chores|errands|assignments?|projects?)\b/, w: 1 },
    { re: /\b(endless|never ending|never ends|non ?stop)\b/, w: 1 },
  ],
  social_battery: [
    { re: /\bsocial battery\b/, w: 5 },
    { re: /\bpeople\b.*\b(exhausting|draining|tiring|too much|annoying|overwhelming|a lot)\b/, w: 4 },
    { re: /\b(peopled out|peopling|people-ing|small talk|socializing|socialising|socially)\b/, w: 3 },
    { re: /\b(need|want|wanna) (some )?(alone time|to be alone|space|quiet)\b/, w: 3 },
    { re: /\b(introvert\w*|party|parties|crowds?|networking)\b/, w: 2 },
    { re: /\b(exhausting|draining|drained|drains me|exhausted)\b/, w: 1 },
  ],
  unseen_effort: [
    { re: /\b(nobody|no one|noone|no-one)\b.*\b(notic\w*|appreciat\w*|cares?|saw|sees|seen|thank\w*|recogni[sz]\w*|acknowledg\w*|credit)\b/, w: 5, negatable: false },
    { re: /\b(didn'?t|don'?t|doesn'?t|never|won'?t)\b.*\b(notic\w*|appreciat\w*|thank\w*|recogni[sz]\w*|acknowledg\w*)\b/, w: 4, negatable: false },
    { re: /\b(unappreciated|underappreciated|under appreciated|invisible|unnoticed|thankless|taken for granted|overlooked|unseen|unrecogni[sz]ed)\b/, w: 4 },
    { re: /\btook (the |all the )?credit\b/, w: 4 },
    { re: /\b(credit|recognition)\b/, w: 2 },
    { re: /\bhow hard i (work|worked|tried)\b/, w: 2 },
  ],
  tiny_victory: [
    { re: /\bfinally\b/, w: 2 },
    { re: /\b(finished|completed|shipped|submitted|nailed it|crushed it|did it|got it done|pulled it off|passed|aced|launched|wrapped up)\b/, w: 3 },
    { re: /\b(proud|accomplished|victory|win|won|yay|woohoo|hooray|celebrat\w*)\b/, w: 3 },
    { re: /\bpromot(ed|ion)\b/, w: 3 },
  ],
};

// Chinese situation keywords (each hit = 3).
const ZH_RULES: Record<ScoredIntent, string[]> = {
  meeting_fatigue: ["开会", "会议", "又要开", "对齐一下", "拉个会"],
  task_overload: ["做不完", "忙不过来", "事情太多", "活太多", "待办", "加班", "堆成山", "deadline"],
  social_battery: ["社交电量", "不想见人", "社恐", "社交好累", "想一个人待着", "应酬"],
  unseen_effort: ["没人注意", "没人在乎", "没人看见", "没人看到", "没人感谢", "白做了", "抢功", "功劳被"],
  tiny_victory: ["终于做完", "终于搞定", "搞定了", "做到了", "成功了", "升职", "通过了", "拿下"],
};

// Negator right before a match, allowing one word in between ("not overwhelmed", "not really proud").
const NEGATION = /\b(not|never|no longer|hardly|isn'?t|aren'?t|wasn'?t|weren'?t|don'?t|doesn'?t|didn'?t|won'?t|haven'?t|hasn'?t|can'?t|couldn'?t)\s+(?:[\w-]+\s+)?$/;
// Chinese negator right before a keyword ("不开心", "没那么生气").
const ZH_NEGATION = /(不|没|没有|别|不再|并不|不太|不怎么|不是很|没那么|一点也不|一点都不)$/;

const CJK = /[㐀-鿿]/;

/** Captions follow the user's language: any Chinese character -> zh. */
export function detectLang(text: string): Lang {
  return CJK.test(text) ? "zh" : "en";
}

// Lowercase, drop apostrophes ("won't" -> "wont" so \bwon\b can't match it), strip punctuation.
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/['’‘`]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function ruleMatches(s: string, rule: Rule): boolean {
  const re = new RegExp(rule.re.source, "g");
  for (const m of s.matchAll(re)) {
    if (rule.negatable === false) return true;
    if (!NEGATION.test(s.slice(0, m.index) + " ")) return true;
  }
  return false;
}

/** True if any keyword occurs in the raw text without a Chinese negator right before it. */
function zhMatches(raw: string, keywords: string[]): boolean {
  for (const k of keywords) {
    let i = raw.indexOf(k);
    while (i !== -1) {
      if (!ZH_NEGATION.test(raw.slice(0, i))) return true;
      i = raw.indexOf(k, i + 1);
    }
  }
  return false;
}

export function scoreIntents(text: string): Record<ScoredIntent, number> {
  const s = normalize(text);
  const raw = text.toLowerCase();
  const out = {} as Record<ScoredIntent, number>;
  for (const intent of Object.keys(RULES) as ScoredIntent[]) {
    out[intent] = RULES[intent].reduce((sum, r) => (ruleMatches(s, r) ? sum + r.w : sum), 0) + (zhMatches(raw, ZH_RULES[intent]) ? 3 : 0);
  }
  return out;
}

/** Best intent, or `general` when nothing scores high enough or the top two tie (ambiguous). */
export function matchIntent(text: string): { intent: MoodIntent; confidence: number } {
  const ranked = Object.entries(scoreIntents(text)).sort((a, b) => b[1] - a[1]) as [ScoredIntent, number][];
  const [top, second] = ranked;
  if (top[1] < MIN_SCORE || top[1] === second[1]) return { intent: "general", confidence: 0 };
  return { intent: top[0], confidence: Math.round(((top[1] - second[1]) / top[1]) * 100) / 100 };
}

export type ValidationResult = { ok: true; text: string } | { ok: false; error: string };

export function validateMoodText(raw: unknown): ValidationResult {
  if (typeof raw !== "string" || !raw.trim()) return { ok: false, error: "Tell me how you feel in a few words." };
  const text = raw.trim();
  if (text.length > MAX_MOOD_LENGTH) return { ok: false, error: `Keep it to one sentence (${MAX_MOOD_LENGTH} characters max).` };
  return { ok: true, text };
}

// ---------------- feelings ----------------

const r = (re: RegExp, negatable?: boolean): Rule => ({ re, w: 3, negatable });

const FEELING_RULES: Record<ScoredFeeling, Rule[]> = {
  tired: [
    r(/\b(tired|exhausted|exhausting|drained|draining|sleepy|fatigued|worn out|wiped|burn(ed|t)? out|burnout|no energy|running on (empty|fumes)|need (a )?nap|cant keep my eyes open)\b/),
    { re: /\bso done\b/, w: 2 },
  ],
  sad: [
    r(/\b(sad|blue|depressed|cry|crying|cried|tears|heartbroken|hurt|hurts|upset|miserable|disappointed|unhappy|grief|grieving|gloomy|heavy|empty|hopeless|ignored|unappreciated|underappreciated|invisible)\b/),
    r(/\b(feeling|feel|so|really|bit) down\b/),
    r(/\bnot (feeling |doing )?(good|great|okay|ok|fine|happy|well)\b/, false),
  ],
  wronged: [
    r(/\b(wronged|misunderstood|blamed|falsely accused|accused|scolded|not my fault|wasnt my fault|treated unfairly|unfairly|took it out on me|yelled at me|blamed me)\b/),
  ],
  jealous: [r(/\b(jealous|jealousy|envious|envy|envying)\b/)],
  regret: [
    r(/\b(regret\w*|wish i had|wish i hadnt|should have|shouldve|could have|couldve|if only|too late|missed (the|my|out|it|that|a) ?\w*|let it slip|blew it|blew my chance)\b/),
  ],
  dejected: [
    r(/\b(dejected|discouraged|defeated|demoralized|demoralised|deflated|crushed|disheartened|bummed|let down|failed|failure|rejected|gave up|give up|no point|whats the point)\b/),
  ],
  forlorn: [r(/\b(forlorn|desolate|bleak|melancholy|melancholic|abandoned|left behind|forgotten|faded|all quiet|everyone left|everyone is gone)\b/)],
  lonely: [
    r(/\b(lonely|loneliness|isolated|left out|no one to talk to|nobody to talk to|no friends|disconnected|by myself|miss (him|her|them|you|my|home|someone|people))\b/),
    r(/\b(feel|feeling|so|all) alone\b/),
  ],
  indignant: [
    r(/\b(angry|mad|annoyed|annoying|irritated|irritating|frustrat\w*|unfair|not fair|resent\w*|fed up|sick of|hate|indignant|ugh+|how dare)\b/),
  ],
  furious: [
    r(/\b(furious|livid|rage|raging|enraged|pissed|fuming|outraged|seeing red|boiling|so angry|so mad|really angry|really mad|want to scream|wanna scream|losing it|about to explode)\b/),
  ],
  scared: [r(/\b(scared|afraid|terrified|frightened|fear|fearful|horrified|petrified|spooked|creeped out)\b/)],
  anxious: [
    r(/\b(anxious|anxiety|nervous|worried|worry|worrying|stressed|stress|stressful|overthinking|tense|uneasy|restless|jittery|butterflies|cant sit still|panic\w*)\b/),
    r(/\bcant (stop|quit) (thinking|worrying|overthinking|spiraling|spiralling)\b/, false),
  ],
  on_edge: [
    r(/\b(on edge|on pins and needles|walking on eggshells|holding my breath|other shoe|dread\w*|bracing|nerve ?wracking|edgy|jumpy|cant relax|waiting for (the )?(results|news|call|verdict))\b/),
  ],
  shocked: [r(/\b(shocked|shock|shook|startled|freaked out|freaking out|what just happened|oh no|gasp|jump scare|heart dropped|heart sank)\b/)],
  stunned: [r(/\b(stunned|speechless|dumbfounded|flabbergasted|gobsmacked|jaw dropped|jaw drop|no words|at a loss for words|cant believe|mind blown|mindblown)\b/)],
  surprised: [r(/\b(surprised|surprise|unexpected|didnt expect|did not expect|didnt see that coming|out of nowhere|whoa|caught off guard)\b/)],
  baffled: [
    r(/\b(baffled|puzzled|perplexed|bewildered|huh|makes no sense|doesnt make sense|didnt make sense|bizarre|nonsense|what the|wtf|why would (anyone|they|he|she))\b/),
  ],
  confused: [
    r(/\b(confused|confusing|lost|directionless|aimless|unsure|uncertain|dont know what to do|dont know where|dont know which|no idea what to do|which way|what do i want|stuck in life)\b/),
  ],
  disgusted: [r(/\b(disgust\w*|gross|ew+|yuck|ick|cringe|cringey|repulsed|revolting|nasty|cant stand)\b/)],
  overwhelmed: [r(/\b(overwhelm\w*|swamped|drowning|buried|cant cope|cant handle|falling apart|too much|so much|everything at once|all at once|piling up)\b/)],
  torn: [
    r(/\b(torn|conflicted|cant decide|indecisive|second guessing|what if|afraid (to|of) los\w*|scared (to|of) los\w*|fear of losing|back and forth|insecure|hot and cold)\b/),
  ],
  wistful: [
    r(/\b(wistful|nostalgi\w*|reminisc\w*|memories|good old days|miss the old|miss those|last day|saying goodbye|goodbyes?|dont want (it|this) to end|dont want to leave|moving away|farewell)\b/),
  ],
  bored: [r(/\b(bored|boring|boredom|nothing to do|so slow|meh|dull|killing time|idle|time is dragging)\b/)],
  relieved: [
    r(/\b(relieved|relief|let it go|letting go|let go|moved on|moving on|made peace|at peace with|weight off|phew|its over|finally over|closure|forgave|forgive)\b/),
  ],
  calm: [r(/\b(calm|peaceful|serene|tranquil|zen|centered|centred|grounded|at peace|still inside|quiet mind)\b/)],
  relaxed: [r(/\b(relaxed|relaxing|chill|chilling|chilled|lazy|cozy|cosy|comfy|unwind\w*|laid back|taking it easy|take it easy|vacation|day off|weekend vibes)\b/)],
  happy: [
    r(/\b(happy|glad|great|proud|grateful|thankful|joy\w*|amazing|awesome|wonderful|love it|celebrat\w*|finally|did it|nailed it|promoted|won|good day|lovely)\b/),
  ],
  elated: [
    r(/\b(ecstatic|elated|thrilled|overjoyed|over the moon|so excited|excited|dancing|cant stop smiling|best day ever|woohoo|yay+|yippee|hooray|on cloud nine)\b/),
  ],
};

// Chinese feeling keywords (each feeling scores 3 on any hit). Avoid single characters
// that occur inside unrelated words (e.g. 累 in 积累, 困 in 困惑).
const ZH_FEELING_RULES: Record<ScoredFeeling, string[]> = {
  tired: ["好累", "太累", "很累", "累死", "累了", "心累", "累得", "疲惫", "疲倦", "好困", "困死", "犯困", "没电了", "精疲力尽", "筋疲力尽", "熬夜", "撑不住"],
  sad: ["难过", "伤心", "想哭", "哭了", "大哭", "哭泣", "心痛", "心碎", "不开心", "难受", "悲伤", "郁闷", "心情不好", "失望"],
  wronged: ["委屈", "冤枉", "被误会", "背锅", "不是我的错", "被骂", "被冤"],
  jealous: ["吃醋", "嫉妒", "妒忌", "酸了", "眼红", "醋"],
  regret: ["遗憾", "可惜", "后悔", "错过", "要是当时", "早知道", "如果当初", "差一点"],
  dejected: ["沮丧", "灰心", "泄气", "丧气", "好丧", "很丧", "挫败", "打击", "失败了", "没希望", "心灰意冷", "被拒"],
  forlorn: ["落寞", "寂寥", "冷清", "凄凉", "萧瑟", "失落", "空落落", "人走茶凉", "曲终人散"],
  lonely: ["孤单", "孤独", "寂寞", "没人陪", "想家", "没有朋友", "没人说话"],
  indignant: ["愤愤不平", "不公平", "生气", "不爽", "凭什么", "烦死", "气死", "好气", "很气", "不服", "火大", "憋屈"],
  furious: ["暴跳如雷", "气炸", "暴怒", "抓狂", "怒火", "气疯", "火冒三丈", "怒不可遏", "发飙", "要炸了"],
  scared: ["恐惧", "害怕", "好怕", "怕怕", "吓人", "恐怖", "可怕", "不敢"],
  anxious: ["忐忑", "不安", "焦虑", "紧张", "担心", "心慌", "慌张", "发慌", "七上八下", "坐立不安"],
  on_edge: ["提心吊胆", "心惊胆战", "胆战心惊", "战战兢兢", "如履薄冰", "悬着", "等结果", "等消息"],
  shocked: ["大惊失色", "吓一跳", "吓死", "震惊", "惊吓", "吓坏", "吓到", "大吃一惊"],
  stunned: ["目瞪口呆", "呆住", "傻眼", "惊呆", "无语", "说不出话", "愣住", "瞠目结舌"],
  surprised: ["诧异", "惊讶", "意外", "没想到", "居然", "竟然", "出乎意料"],
  baffled: ["莫名其妙", "搞不懂", "什么鬼", "离谱", "一头雾水", "懵", "看不懂", "不明白"],
  confused: ["迷茫", "困惑", "迷惑", "不知道该怎么办", "不知道怎么办", "迷路", "没有方向", "找不到方向"],
  disgusted: ["嫌弃", "恶心", "讨厌", "厌恶", "受不了", "反感", "膈应"],
  overwhelmed: ["崩溃", "压力山大", "压力好大", "压力很大", "喘不过气", "忙疯", "忙死", "太多了", "应接不暇", "焦头烂额"],
  torn: ["患得患失", "纠结", "犹豫", "得失", "怕失去", "怕得不到", "忽冷忽热"],
  wistful: ["留恋", "舍不得", "怀念", "不舍", "回忆", "依依不舍", "念念不忘", "最后一天"],
  bored: ["百无聊赖", "无聊", "没意思", "好闲", "发呆", "没事做", "打发时间"],
  relieved: ["释怀", "放下了", "释然", "松了口气", "松口气", "解脱", "想开了", "想通了", "终于结束"],
  calm: ["心如止水", "心平气和", "平静", "淡定", "安宁", "宁静", "安心"],
  relaxed: ["松弛", "放松", "惬意", "舒服", "躺平", "摸鱼", "悠闲", "慢慢来"],
  happy: ["开心", "高兴", "快乐", "幸福", "满足", "美滋滋", "骄傲", "好开心", "真好"],
  elated: ["手舞足蹈", "太开心了", "激动", "兴奋", "开心到飞起", "欢呼", "乐疯了", "高兴坏了", "耶"],
};

// When scores tie, the more specific / heavier feeling is the one most worth mirroring.
const FEELING_PRIORITY: ScoredFeeling[] = [
  "furious",
  "wronged",
  "jealous",
  "torn",
  "on_edge",
  "scared",
  "shocked",
  "stunned",
  "dejected",
  "forlorn",
  "wistful",
  "regret",
  "lonely",
  "overwhelmed",
  "disgusted",
  "confused",
  "baffled",
  "surprised",
  "sad",
  "anxious",
  "indignant",
  "tired",
  "bored",
  "relieved",
  "calm",
  "relaxed",
  "elated",
  "happy",
];

export function scoreFeelings(text: string): Record<ScoredFeeling, number> {
  const s = normalize(text);
  const raw = text.toLowerCase();
  const out = {} as Record<ScoredFeeling, number>;
  for (const f of FEELING_PRIORITY) {
    out[f] = FEELING_RULES[f].reduce((sum, rule) => (ruleMatches(s, rule) ? sum + rule.w : sum), 0) + (zhMatches(raw, ZH_FEELING_RULES[f]) ? 3 : 0);
  }
  return out;
}

/** Dominant feeling. A light + heavy tie reads as `mixed` (bittersweet); nothing detected is also `mixed`. */
export function detectFeeling(text: string): { feeling: Feeling; score: number } {
  const scores = scoreFeelings(text);
  const top = Math.max(...Object.values(scores));
  if (top < MIN_SCORE) return { feeling: "mixed", score: 0 };
  const tied = FEELING_PRIORITY.filter((f) => scores[f] === top);
  if (tied.some((f) => LIGHT_FEELINGS.includes(f)) && tied.some((f) => HEAVY_FEELINGS.includes(f))) return { feeling: "mixed", score: top };
  return { feeling: tied[0], score: top };
}

// ---------------- selection ----------------

export type AnimationSelection = {
  sceneId: ArtId; // which art to render
  moodIntent: MoodIntent; // situation we understood
  feeling: Feeling; // feeling the critter is mirroring
  feelingLabel: string; // in the user's language
  lang: Lang;
  photoId: PhotoId; // default photo for this feeling
  confidence: number;
  caption: string; // first person, in the user's voice
  alt: string; // describes the default photo
  durationMs: number;
  variant: number;
  variantCount: number;
};

export function selectMoodAnimation(text: string, opts: { variant?: number } = {}): AnimationSelection {
  const lang = detectLang(text);
  const { intent, confidence } = matchIntent(text);
  const detected = detectFeeling(text);

  let sceneId: ArtId;
  let feeling: Feeling;
  let captions: string[];
  let durationMs: number;

  const situation = intent === "general" ? null : SITUATION_SCENES[intent];
  const feelingConflicts = situation && detected.score >= MIN_SCORE && !situation.feelings.includes(detected.feeling);

  if (situation && !feelingConflicts) {
    // The situation story fits how they feel. Mirror it.
    feeling = detected.score >= MIN_SCORE ? detected.feeling : situation.feelings[0];
    captions = situation.captions[lang];
    if (situation.hasArt) {
      sceneId = situation.id as ArtId;
      durationMs = situation.durationMs;
    } else {
      sceneId = `feel_${feeling}`;
      durationMs = FEELING_SCENES[feeling].durationMs;
    }
  } else {
    // No situation, or the user's feeling differs from the situation's usual tone
    // ("meetings make me anxious"): the feeling wins.
    feeling = detected.feeling;
    const scene = FEELING_SCENES[feeling];
    sceneId = `feel_${feeling}`;
    captions = scene.captions[lang];
    durationMs = scene.durationMs;
  }

  const variant = Math.abs(Math.trunc(opts.variant ?? 0)) % captions.length;
  const photoId = defaultPhoto(feeling);
  return {
    sceneId,
    moodIntent: intent,
    feeling,
    feelingLabel: FEELING_SCENES[feeling].label[lang],
    lang,
    photoId,
    confidence,
    caption: captions[variant],
    alt: photo(photoId).alt,
    durationMs,
    variant,
    variantCount: captions.length,
  };
}
