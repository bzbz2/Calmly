import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { runChat } from "@/lib/agent/run";
import { FEELINGS } from "@/lib/critter/catalog";

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
  try {
    const out = await runChat({
      userId: session.user.id,
      userName: session.user.name ?? "",
      text: parsed.data.text,
      conversationId: parsed.data.conversationId,
      tzOffset: parsed.data.tzOffset,
      feeling: parsed.data.feeling,
    });
    return NextResponse.json(out);
  } catch (e) {
    console.error("chat error", e);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
