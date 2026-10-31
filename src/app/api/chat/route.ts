import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { runChat } from "@/lib/agent/run";

export const maxDuration = 60;

const body = z.object({ text: z.string().trim().min(1).max(4000), conversationId: z.string().uuid().optional() });

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
    });
    return NextResponse.json(out);
  } catch (e) {
    console.error("chat error", e);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
