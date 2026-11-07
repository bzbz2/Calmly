import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db, feelingCorrections, messages, moodEntries } from "@/db";
import { FEELINGS } from "@/lib/critter/catalog";
import { hasMoodSignal, selectMoodAnimation } from "@/lib/critter/match";

// The user corrects the buddy's feeling for one of their messages. The correction
// becomes the message's feeling (so the buddy, diary and patterns use it) and is
// logged with what keywords and the LLM had picked, to show where matching is wrong.

const body = z.object({ messageId: z.string().uuid(), feeling: z.enum(FEELINGS) });

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid correction" }, { status: 400 });
  const { messageId, feeling } = parsed.data;

  const [msg] = await db
    .select({ id: messages.id, content: messages.content, feeling: messages.feeling, role: messages.role })
    .from(messages)
    .where(and(eq(messages.id, messageId), eq(messages.userId, userId)))
    .limit(1);
  if (!msg || msg.role !== "user") return NextResponse.json({ error: "Message not found" }, { status: 404 });

  const matcherFeeling = hasMoodSignal(msg.content) ? selectMoodAnimation(msg.content.slice(0, 600)).feeling : null;
  await db.insert(feelingCorrections).values({ userId, messageId, matcherFeeling, llmFeeling: msg.feeling, correctedFeeling: feeling });
  await db.update(messages).set({ feeling }).where(eq(messages.id, messageId));
  await db.update(moodEntries).set({ feeling }).where(and(eq(moodEntries.messageId, messageId), eq(moodEntries.userId, userId)));

  return NextResponse.json({ ok: true, feeling });
}
