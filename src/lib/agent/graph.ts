import { Annotation, END, START, StateGraph, messagesStateReducer } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { AIMessage, BaseMessage, SystemMessage, HumanMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { buildTools } from "./tools";

export const moodSchema = z.object({
  score: z.number().min(1).max(10).describe("Overall mood valence: 1 = very low/distressed, 5 = neutral, 10 = great"),
  stress: z.number().int().min(1).max(10).describe("Stress level: 1 = calm, 10 = extreme"),
  label: z.string().describe("Single primary emotion, one or two lowercase words, e.g. 'overwhelmed'"),
  emotions: z.array(z.string()).max(5).describe("Up to 5 emotions present"),
  triggers: z.array(z.string()).max(4).describe("Short phrases naming causes of stress, e.g. 'deadline', 'manager'"),
});
export type Mood = z.infer<typeof moodSchema>;

const riskSchema = z.object({
  risk: z.enum(["none", "elevated", "high"]).describe("high = explicit self-harm/suicidal intent, plan, or immediate danger; elevated = hopelessness or passive ideation; none otherwise"),
});

export const CRISIS_MESSAGE = `I'm really glad you told me this, and I'm concerned about how much pain you're in. You deserve support from a real person right now.

• **In the US:** call or text **988** (Suicide & Crisis Lifeline), available 24/7.
• **Crisis Text Line:** text **HOME** to **741741**.
• **Outside the US:** find a local line at https://findahelpline.com
• If you're in immediate danger, call your local emergency number.

If you can, reach out to someone you trust and tell them how you're feeling. I'm still here to talk with you, and I'm not a substitute for professional help.`;

const State = Annotation.Root({
  messages: Annotation<BaseMessage[]>({ reducer: messagesStateReducer, default: () => [] }),
  userName: Annotation<string>(),
  birthdate: Annotation<string | null>(),
  memory: Annotation<string>(), // rolling summary of the user
  moodHistory: Annotation<string>(), // textual recent mood trend
  userText: Annotation<string>(), // latest user message
  risk: Annotation<"none" | "elevated" | "high">(),
  mood: Annotation<Mood | null>(),
  newMemory: Annotation<string>(),
  reply: Annotation<string>(),
});

const modelName = () => process.env.OPENAI_MODEL || "gpt-4o-mini";
const llm = (temperature = 0.7) => new ChatOpenAI({ model: modelName(), temperature });

function systemPrompt(s: typeof State.State) {
  const today = new Date().toDateString();
  return `You are Calmly, a warm, emotionally intelligent companion who helps people reduce stress. You are NOT a therapist or doctor; never diagnose.

About the user (${s.userName || "friend"}):
- Memory from past chats: ${s.memory || "(first conversation, nothing yet)"}
- Recent mood trend: ${s.moodHistory || "(no data yet)"}
- Birthdate on file: ${s.birthdate || "not provided"}
- Today: ${today}
${s.risk === "elevated" ? "\nThe user may be struggling deeply. Be extra gentle, validate, and softly mention that talking to someone they trust or a professional (988 in the US) can help." : ""}

How to respond:
1. LISTEN FIRST. Reflect their feelings in your own words and validate. Keep replies short (3-6 sentences) and conversational, no headers.
2. If they just want to vent, let them vent: don't rush into advice. Ask at most one gentle question.
3. When helpful (or invited), gently explain WHY they might feel this way (psychology: stress response, cognitive distortions, burnout, etc.) and offer 1-3 small concrete actions.
4. Offer tools sparingly and only when fitting or asked: breathing_exercise, cbt_reframe, food_therapy, tarot_reading, astrology_insight. Frame tarot/astrology as playful reflection, never prediction. Use tools rather than inventing their content.
5. Personalize using memory and mood trend (e.g. notice patterns like "work stress has been recurring"). Don't recite their history robotically.
6. A little warmth/humor is welcome when the person seems open to it.`;
}

export function buildGraph(opts: { birthdate?: string | null }) {
  const tools = buildTools({ birthdate: opts.birthdate });
  const responderModel = llm().bindTools(tools);

  const crisisCheck = async (s: typeof State.State) => {
    try {
      const r = await llm(0).withStructuredOutput(riskSchema).invoke([
        new SystemMessage("Assess self-harm / suicide risk in the user's latest message, considering the context. Be accurate; ordinary stress or venting is 'none'."),
        ...s.messages.slice(-4),
      ]);
      return { risk: r.risk };
    } catch {
      return { risk: "none" as const };
    }
  };

  const crisisResponse = async () => ({ reply: CRISIS_MESSAGE, messages: [new AIMessage(CRISIS_MESSAGE)] });

  const moodExtract = async (s: typeof State.State) => {
    try {
      const mood = await llm(0).withStructuredOutput(moodSchema).invoke([
        new SystemMessage("Extract the user's current emotional state from the conversation, focusing on their latest message. Be calibrated and consistent."),
        ...s.messages.slice(-6),
      ]);
      return { mood };
    } catch {
      return { mood: null };
    }
  };

  const responder = async (s: typeof State.State) => {
    const res = await responderModel.invoke([new SystemMessage(systemPrompt(s)), ...s.messages]);
    const text = typeof res.content === "string" ? res.content : res.content.map((c) => ("text" in c ? c.text : "")).join("");
    return { messages: [res], reply: text };
  };

  const updateMemory = async (s: typeof State.State) => {
    try {
      const res = await llm(0.2).invoke([
        new SystemMessage(
          "You maintain a private, concise memory profile (max 150 words) of a user of a stress-relief chat app. Merge prior memory with new info: recurring stressors, people/roles, what helps them, preferences (e.g. likes tarot, dislikes advice), life context. Facts only, no diagnoses. Output the updated memory text only.",
        ),
        new HumanMessage(`Prior memory:\n${s.memory || "(none)"}\n\nLatest user message:\n${s.userText}\n\nAssistant reply:\n${s.reply}`),
      ]);
      return { newMemory: typeof res.content === "string" ? res.content.trim() : s.memory };
    } catch {
      return { newMemory: s.memory };
    }
  };

  const routeCrisis = (s: typeof State.State) => (s.risk === "high" ? "crisisResponse" : "responder");
  const routeResponder = (s: typeof State.State) => {
    const last = s.messages[s.messages.length - 1];
    return last instanceof AIMessage && last.tool_calls?.length ? "tools" : "updateMemory";
  };

  return new StateGraph(State)
    .addNode("crisisCheck", crisisCheck)
    .addNode("moodExtract", moodExtract)
    .addNode("crisisResponse", crisisResponse)
    .addNode("responder", responder)
    .addNode("tools", new ToolNode(tools))
    .addNode("updateMemory", updateMemory)
    .addEdge(START, "crisisCheck")
    .addEdge("crisisCheck", "moodExtract")
    .addConditionalEdges("moodExtract", routeCrisis, ["crisisResponse", "responder"])
    .addConditionalEdges("responder", routeResponder, ["tools", "updateMemory"])
    .addEdge("tools", "responder")
    .addEdge("crisisResponse", "updateMemory")
    .addEdge("updateMemory", END)
    .compile();
}
