import { and, asc, desc, eq, gte } from "drizzle-orm";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { db, conversations, messages, moodEntries, profiles } from "@/db";
import { buildGraph } from "./graph";
import { isFeeling } from "../critter/catalog";
import { findPatterns, patternsForPrompt } from "../personal/patterns";

const HISTORY_LIMIT = 20;

/** Mood history window used for trend text and pattern detection. */
const PATTERN_WINDOW_DAYS = 56;

export async function runChat(opts: { userId: string; userName: string; conversationId?: string; text: string; tzOffset?: number }) {
  const { userId, text } = opts;

  // Conversation (create or verify ownership)
  let conversationId = opts.conversationId;
  if (conversationId) {
    const [c] = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(and(eq(conversations.id, conversationId), eq(conversations.userId, userId)))
      .limit(1);
    if (!c) throw new Error("Conversation not found");
  } else {
    const [c] = await db
      .insert(conversations)
      .values({ userId, title: text.slice(0, 60) })
      .returning({ id: conversations.id });
    conversationId = c.id;
  }

  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  const history = await db
    .select({ role: messages.role, content: messages.content })
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt))
    .limit(HISTORY_LIMIT);
  history.reverse();

  const history56 = await db
    .select()
    .from(moodEntries)
    .where(and(eq(moodEntries.userId, userId), gte(moodEntries.createdAt, new Date(Date.now() - PATTERN_WINDOW_DAYS * 86_400_000))))
    .orderBy(desc(moodEntries.createdAt))
    .limit(300);
  history56.reverse(); // oldest first
  const patterns = patternsForPrompt(findPatterns(history56, new Date(), opts.tzOffset ?? 0));
  const moodHistory = history56
    .slice(-10)
    .map((m) => `${m.createdAt.toISOString().slice(0, 10)}: ${m.label} (mood ${m.score}/10, stress ${m.stress}/10${m.triggers.length ? `; ${m.triggers.join(", ")}` : ""})`)
    .join("\n");

  const graph = buildGraph({ birthdate: profile?.birthdate });
  const result = await graph.invoke({
    messages: [
      ...history.map((m) => (m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content))),
      new HumanMessage(text),
    ],
    userName: opts.userName,
    birthdate: profile?.birthdate ?? null,
    memory: profile?.summary ?? "",
    moodHistory,
    patterns,
    userText: text,
  });

  const reply = result.reply || "I'm here with you. Tell me more?";

  const crisis = result.risk === "high";
  // Explicit timestamps keep user/assistant ordering stable within a batch insert.
  const now = Date.now();

  // The LLM's feeling for this message: one of the 29, "none" (no clear feeling), or null (no mood extracted).
  const feeling = result.mood ? (isFeeling(result.mood.feeling) ? result.mood.feeling : "none") : null;

  const inserted = await db
    .insert(messages)
    .values([
      { conversationId, userId, role: "user", content: text, feeling, createdAt: new Date(now) },
      { conversationId, userId, role: "assistant", content: reply, createdAt: new Date(now + 1) },
    ])
    .returning({ id: messages.id, role: messages.role });
  const userMessageId = inserted.find((m) => m.role === "user")?.id ?? null;

  let mood = null;
  if (result.mood) {
    const m = result.mood;
    [mood] = await db
      .insert(moodEntries)
      .values({
        userId,
        conversationId,
        messageId: userMessageId,
        score: m.score,
        stress: m.stress,
        label: m.label.toLowerCase(),
        emotions: m.emotions,
        triggers: m.triggers,
        feeling: isFeeling(m.feeling) ? m.feeling : null,
      })
      .returning();
  }

  if (result.newMemory !== undefined && result.newMemory !== (profile?.summary ?? "")) {
    await db
      .insert(profiles)
      .values({ userId, summary: result.newMemory })
      .onConflictDoUpdate({ target: profiles.userId, set: { summary: result.newMemory, updatedAt: new Date() } });
  }

  return { conversationId, reply, mood, crisis, userMessageId, feeling };
}

export async function loadConversation(userId: string, conversationId: string) {
  return db
    .select({ id: messages.id, role: messages.role, content: messages.content, feeling: messages.feeling })
    .from(messages)
    .where(and(eq(messages.conversationId, conversationId), eq(messages.userId, userId)))
    .orderBy(asc(messages.createdAt));
}
