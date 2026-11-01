import { describe, expect, test } from "bun:test";
import { detectFeeling, detectLang, selectMoodAnimation } from "../../src/lib/critter/match";
import { FEELING_SCENES, SITUATION_SCENES } from "../../src/lib/critter/catalog";
import { screenCrisis } from "../../src/lib/critter/safety";

describe("richer English feelings", () => {
  const cases: [string, string][] = [
    ["It wasn't my fault and they blamed me anyway", "wronged"],
    ["I'm kind of jealous of my best friend", "jealous"],
    ["I regret not telling her sooner", "regret"],
    ["I'm so excited I could dance", "elated"],
    ["I failed again, feeling so defeated", "dejected"],
    ["everyone left and it feels so desolate", "forlorn"],
    ["I'm so annoyed at this", "indignant"],
    ["I'm absolutely furious right now", "furious"],
    ["I'm really scared of the dark", "scared"],
    ["I'm nervous about the interview", "anxious"],
    ["walking on eggshells waiting for the results", "on_edge"],
    ["I'm shocked, what just happened", "shocked"],
    ["I'm speechless, my jaw dropped", "stunned"],
    ["I didn't expect that at all, so surprised", "surprised"],
    ["That makes no sense, I'm baffled", "baffled"],
    ["I feel so lost, I don't know what to do with my life", "confused"],
    ["Ew, that's so gross", "disgusted"],
    ["I'm torn, afraid to lose what I have", "torn"],
    ["Last day at the old office, feeling nostalgic", "wistful"],
    ["I'm so bored, nothing to do", "bored"],
    ["I finally let it go, what a relief", "relieved"],
    ["I feel calm and peaceful", "calm"],
    ["so relaxed and cozy this weekend", "relaxed"],
  ];
  for (const [input, feeling] of cases) test(input, () => expect(detectFeeling(input).feeling).toBe(feeling as never));
  test("specific beats generic on a tie: 'so angry' is furious", () => expect(detectFeeling("I'm so angry").feeling).toBe("furious"));
  test("'wow, I'm so happy' stays happy", () => expect(detectFeeling("wow I'm so happy").feeling).toBe("happy"));
});

describe("Chinese input", () => {
  const cases: [string, string][] = [
    ["明明不是我的错，好委屈", "wronged"],
    ["看到他们在一起，我有点吃醋", "jealous"],
    ["错过了这次机会，好遗憾", "regret"],
    ["开心到手舞足蹈", "elated"],
    ["努力了这么久还是失败了，好沮丧", "dejected"],
    ["一个人走在街上，有点落寞", "forlorn"],
    ["越想越愤愤不平", "indignant"],
    ["我气炸了，暴跳如雷", "furious"],
    ["好害怕，好恐惧", "scared"],
    ["明天面试，心里忐忑不安", "anxious"],
    ["等结果的这几天提心吊胆", "on_edge"],
    ["听到消息我大惊失色", "shocked"],
    ["我目瞪口呆", "stunned"],
    ["他居然这么说，我很诧异", "surprised"],
    ["这事太莫名其妙了", "baffled"],
    ["最近很迷茫，不知道该怎么办", "confused"],
    ["这个人真让我嫌弃", "disgusted"],
    ["压力山大，喘不过气", "overwhelmed"],
    ["感情里总是患得患失", "torn"],
    ["要毕业了，好舍不得，很留恋", "wistful"],
    ["百无聊赖地刷手机", "bored"],
    ["我终于释怀了", "relieved"],
    ["此刻心如止水", "calm"],
    ["周末躺平，好松弛", "relaxed"],
    ["今天好开心", "happy"],
    ["好累，想睡觉", "tired"],
    ["今天很难过", "sad"],
    ["好孤单", "lonely"],
  ];
  for (const [input, feeling] of cases) test(input, () => expect(detectFeeling(input).feeling).toBe(feeling as never));

  test("Chinese negation: 不开心 is not happy", () => {
    expect(detectFeeling("我今天不开心").feeling).toBe("sad");
    expect(detectFeeling("我一点也不开心").feeling).not.toBe("happy");
  });
  test("language detection", () => {
    expect(detectLang("I'm tired")).toBe("en");
    expect(detectLang("好累")).toBe("zh");
  });
  test("Chinese input gets Chinese captions and labels", () => {
    const s = selectMoodAnimation("明明不是我的错，好委屈");
    expect(s.lang).toBe("zh");
    expect(s.feelingLabel).toBe("委屈");
    expect(FEELING_SCENES.wronged.captions.zh).toContain(s.caption);
  });
  test("Chinese situation keywords", () => {
    const s = selectMoodAnimation("又要开会，好累");
    expect(s.moodIntent).toBe("meeting_fatigue");
    expect(SITUATION_SCENES.meeting_fatigue.captions.zh).toContain(s.caption);
  });
  test("English input keeps English captions", () => {
    const s = selectMoodAnimation("I'm so bored");
    expect(s.lang).toBe("en");
    expect(s.feelingLabel).toBe("bored");
    expect(FEELING_SCENES.bored.captions.en).toContain(s.caption);
  });
});

describe("Chinese crisis screen", () => {
  for (const t of ["我不想活了", "有时候想自杀", "活着没意思", "想伤害自己", "真想一了百了"]) {
    test(`flags: ${t}`, () => expect(screenCrisis(t)).toBe(true));
  }
  for (const t of ["累死了", "笑死我了", "气死我了", "无聊死了"]) {
    test(`ignores: ${t}`, () => expect(screenCrisis(t)).toBe(false));
  }
});
