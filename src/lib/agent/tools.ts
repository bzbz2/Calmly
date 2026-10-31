import { tool } from "@langchain/core/tools";
import { z } from "zod";

const MAJOR_ARCANA: { name: string; up: string; rev: string }[] = [
  { name: "The Fool", up: "new beginnings, trust, a leap of faith", rev: "hesitation, recklessness, fear of the unknown" },
  { name: "The Magician", up: "resourcefulness, focus, you have what you need", rev: "scattered energy, self-doubt" },
  { name: "The High Priestess", up: "intuition, quiet knowing, rest", rev: "ignoring your gut, secrets" },
  { name: "The Empress", up: "nurture, comfort, abundance", rev: "self-neglect, burnout" },
  { name: "The Emperor", up: "structure, boundaries, stability", rev: "rigidity, control issues" },
  { name: "The Hierophant", up: "tradition, support from trusted guidance", rev: "breaking rules that no longer serve you" },
  { name: "The Lovers", up: "alignment with values, meaningful choices", rev: "misalignment, indecision" },
  { name: "The Chariot", up: "determination, momentum", rev: "feeling pulled in many directions" },
  { name: "Strength", up: "gentle courage, self-compassion", rev: "self-doubt, depleted energy" },
  { name: "The Hermit", up: "solitude, reflection, inner guidance", rev: "isolation, withdrawing too much" },
  { name: "Wheel of Fortune", up: "cycles turning, change is coming", rev: "resisting change, bad-luck feelings" },
  { name: "Justice", up: "fairness, clarity, honest assessment", rev: "unfairness, avoiding accountability" },
  { name: "The Hanged Man", up: "pause, new perspective, surrender", rev: "stalling, needless sacrifice" },
  { name: "Death", up: "endings that make room for renewal", rev: "clinging to what's over" },
  { name: "Temperance", up: "balance, moderation, healing", rev: "excess, imbalance" },
  { name: "The Devil", up: "noticing unhealthy patterns or attachments", rev: "breaking free, releasing a burden" },
  { name: "The Tower", up: "sudden upheaval that clears the way", rev: "fear of change, avoiding the inevitable" },
  { name: "The Star", up: "hope, healing, renewal", rev: "discouragement, lost faith" },
  { name: "The Moon", up: "uncertainty, emotions, dreams", rev: "clarity emerging, release of fear" },
  { name: "The Sun", up: "joy, vitality, success", rev: "temporary clouds, dimmed optimism" },
  { name: "Judgement", up: "reflection, renewal, a fresh start", rev: "self-criticism, ignoring the call" },
  { name: "The World", up: "completion, integration, accomplishment", rev: "loose ends, almost there" },
];

const SIGNS = [
  { name: "Capricorn", element: "Earth", from: [12, 22], traits: "ambitious, disciplined, tends to carry too much responsibility", tip: "schedule real rest like a meeting" },
  { name: "Aquarius", element: "Air", from: [1, 20], traits: "independent, inventive, can detach from feelings", tip: "talk it out with a trusted friend" },
  { name: "Pisces", element: "Water", from: [2, 19], traits: "empathic, imaginative, absorbs others' moods", tip: "create emotional boundaries and unwind with music or water" },
  { name: "Aries", element: "Fire", from: [3, 21], traits: "energetic, direct, can run hot when frustrated", tip: "burn off tension with movement" },
  { name: "Taurus", element: "Earth", from: [4, 20], traits: "steady, sensual, stubborn under pressure", tip: "ground yourself with comfort and nature" },
  { name: "Gemini", element: "Air", from: [5, 21], traits: "curious, chatty, mind races when anxious", tip: "journal to slow the mental tabs" },
  { name: "Cancer", element: "Water", from: [6, 21], traits: "nurturing, sensitive, retreats into a shell", tip: "create a cozy safe space" },
  { name: "Leo", element: "Fire", from: [7, 23], traits: "warm, proud, needs to feel appreciated", tip: "do something creative and seek recognition from people you trust" },
  { name: "Virgo", element: "Earth", from: [8, 23], traits: "analytical, helpful, self-critical", tip: "make a small to-do list, then stop at three items" },
  { name: "Libra", element: "Air", from: [9, 23], traits: "harmonious, fair-minded, avoids conflict", tip: "name one thing you need and ask for it" },
  { name: "Scorpio", element: "Water", from: [10, 23], traits: "intense, private, feels deeply", tip: "channel intensity into writing or exercise" },
  { name: "Sagittarius", element: "Fire", from: [11, 22], traits: "optimistic, freedom-loving, restless when boxed in", tip: "plan a small adventure or fresh-air break" },
];

export function sunSign(birthdate: string): (typeof SIGNS)[number] | null {
  const m = /^\d{4}-(\d{2})-(\d{2})$/.exec(birthdate);
  if (!m) return null;
  const month = Number(m[1]);
  const day = Number(m[2]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  // Walk signs in calendar order; the sign whose start date is latest on/before the birthday wins.
  let best = SIGNS[0];
  let bestKey = -1;
  for (const s of SIGNS) {
    const key = s.from[0] * 100 + s.from[1];
    if (key <= month * 100 + day && key > bestKey) {
      best = s;
      bestKey = key;
    }
  }
  return bestKey === -1 ? SIGNS[0] : best; // before Jan 20 => Capricorn
}

const FOOD: Record<string, { foods: string[]; why: string }> = {
  anxious: { foods: ["chamomile or green tea", "oats with banana", "almonds", "dark chocolate (small square)"], why: "magnesium, L-theanine and slow carbs help steady a jittery nervous system" },
  tired: { foods: ["eggs on toast", "berries with yogurt", "lentil soup", "water with a pinch of salt and lemon"], why: "protein + complex carbs + hydration give steady energy without a crash" },
  sad: { foods: ["warm miso or chicken soup", "salmon or walnuts", "sweet potato", "spiced hot chocolate"], why: "omega-3s and warm comfort foods support mood and a sense of care" },
  angry: { foods: ["cool cucumber/mint water", "leafy greens salad", "kiwi", "crunchy veggies with hummus"], why: "cooling, crunchy, fibrous foods give your body something grounding to do" },
  overwhelmed: { foods: ["a simple bowl of rice with egg and veg", "banana + peanut butter", "warm ginger tea"], why: "low-effort, balanced meals reduce decision fatigue" },
  general: { foods: ["a warm drink you enjoy", "fruit + nuts", "whole-grain toast with avocado"], why: "regular, balanced meals stabilise blood sugar, which stabilises mood" },
};

const BREATHING = {
  box: "Box breathing: inhale 4s, hold 4s, exhale 4s, hold 4s. Repeat 4 rounds.",
  "4-7-8": "4-7-8: inhale through nose 4s, hold 7s, exhale slowly through mouth 8s. Repeat 4 times.",
  grounding: "5-4-3-2-1 grounding: name 5 things you see, 4 you feel, 3 you hear, 2 you smell, 1 you taste.",
  sigh: "Physiological sigh: two short inhales through the nose, one long exhale through the mouth. Repeat 3-5 times.",
} as const;

export function buildTools(ctx: { birthdate?: string | null }) {
  const tarot = tool(
    async ({ cards }) => {
      const picked = [...MAJOR_ARCANA].sort(() => Math.random() - 0.5).slice(0, cards);
      const labels = ["Where you are", "What's weighing on you", "A gentle way forward"];
      return JSON.stringify(
        picked.map((c, i) => {
          const reversed = Math.random() < 0.3;
          return { position: cards === 1 ? "Message for today" : labels[i], card: c.name, reversed, meaning: reversed ? c.rev : c.up };
        }),
      );
    },
    {
      name: "tarot_reading",
      description: "Draw tarot cards for a reflective reading. Use only if the user wants tarot or is open to a playful/spiritual angle. Present it as reflection, not prediction.",
      schema: z.object({ cards: z.number().int().min(1).max(3).default(1) }),
    },
  );

  const astrology = tool(
    async ({ birthdate }) => {
      const sign = sunSign(birthdate || ctx.birthdate || "");
      if (!sign) return "No birthdate on file. Ask the user for their birthday (or sun sign) if they want an astrology angle.";
      return JSON.stringify({ sign: sign.name, element: sign.element, traits: sign.traits, copingTip: sign.tip });
    },
    {
      name: "astrology_insight",
      description: "Get sun-sign traits and a coping tip for the user. Use only if the user is interested in astrology. Treat as fun reflection.",
      schema: z.object({ birthdate: z.string().optional().describe("YYYY-MM-DD; omit to use the saved birthdate") }),
    },
  );

  const food = tool(
    async ({ feeling }) => JSON.stringify(FOOD[feeling] ?? FOOD.general),
    {
      name: "food_therapy",
      description: "Suggest foods/drinks that can support the user's current mood.",
      schema: z.object({ feeling: z.enum(["anxious", "tired", "sad", "angry", "overwhelmed", "general"]) }),
    },
  );

  const breathing = tool(
    async ({ technique }) => BREATHING[technique],
    {
      name: "breathing_exercise",
      description: "Return a short guided calming exercise (breathing or grounding) the user can do right now.",
      schema: z.object({ technique: z.enum(["box", "4-7-8", "grounding", "sigh"]) }),
    },
  );

  const reframe = tool(
    async ({ thought }) =>
      JSON.stringify({
        thought,
        questions: [
          "What evidence supports this thought? What evidence doesn't?",
          "What would you say to a friend who thought this?",
          "Is this a fact, or a feeling that feels like a fact?",
          "What's one small thing within your control right now?",
        ],
      }),
    {
      name: "cbt_reframe",
      description: "Offer CBT-style reframing questions for a stressful or negative thought the user shared.",
      schema: z.object({ thought: z.string() }),
    },
  );

  return [tarot, astrology, food, breathing, reframe];
}
