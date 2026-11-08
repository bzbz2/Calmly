import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { runChat } from "@/lib/agent/run";
import { FEELINGS } from "@/lib/critter/catalog";
import { detectLang } from "@/lib/critter/match";
import { GUEST_UI, guestMessagesLeft } from "@/lib/guest";
import { messagesToday } from "@/lib/guest-server";

export const maxDuration = 60;

const body = z.object({
  text: z.string().trim().min(1).max(4000),
  conversationId: z.string().uuid().optional(),
  tzOffset: z.number().int().min(-840).max(840).optional(), // Date#getTimezoneOffset(), for weekday patterns
  feeling: z.enum(FEELINGS).optional(), // set when the user tapped a mood chip: their own choice beats the LLM's
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  // Guests get a few messages a day; signing up lifts the limit.
  const guest = !!session.user.guest;
  const left = guest ? guestMessagesLeft(await messagesToday(session.user.id)) : null;
  if (left === 0) {
    const lang = detectLang(parsed.data.text);
    return NextResponse.json({ error: GUEST_UI[lang].limitReached.text, limit: true, lang }, { status: 429 });
  }
  try {
    const out = await runChat({
      userId: session.user.id,
      userName: session.user.name ?? "",
      text: parsed.data.text,
      conversationId: parsed.data.conversationId,
      tzOffset: parsed.data.tzOffset,
      feeling: parsed.data.feeling,
    });
    return NextResponse.json(left === null ? out : { ...out, guestLeft: left - 1 });
  } catch (e) {
    console.error("chat error", e);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
