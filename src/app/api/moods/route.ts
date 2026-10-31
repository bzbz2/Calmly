import { NextResponse } from "next/server";
import { and, asc, eq, gte } from "drizzle-orm";
import { auth } from "@/auth";
import { db, moodEntries } from "@/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const days = Math.min(365, Math.max(1, Number(new URL(req.url).searchParams.get("days")) || 30));
  const since = new Date(Date.now() - days * 86400_000);
  const rows = await db
    .select()
    .from(moodEntries)
    .where(and(eq(moodEntries.userId, session.user.id), gte(moodEntries.createdAt, since)))
    .orderBy(asc(moodEntries.createdAt));
  return NextResponse.json({ moods: rows });
}
