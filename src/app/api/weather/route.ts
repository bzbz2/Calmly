import { NextResponse } from "next/server";
import { desc, gte } from "drizzle-orm";
import { auth } from "@/auth";
import { db, moodEntries } from "@/db";
import { feelingOfEntry } from "@/lib/personal/moods";
import { moodWeather } from "@/lib/personal/trend";

// Anonymous "mood weather": the most common feeling among everyone who checked in
// over the last 24 hours. One vote per person (their latest check-in). Only aggregate
// counts leave the server, and nothing about feelings is returned below
// WEATHER_MIN_PEOPLE people, so no individual can be singled out.

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const latest = await db
    .selectDistinctOn([moodEntries.userId], { feeling: moodEntries.feeling, label: moodEntries.label, emotions: moodEntries.emotions })
    .from(moodEntries)
    .where(gte(moodEntries.createdAt, new Date(Date.now() - 86_400_000)))
    .orderBy(moodEntries.userId, desc(moodEntries.createdAt));
  const weather = moodWeather(latest.map((r) => feelingOfEntry({ ...r, createdAt: new Date(), stress: 0 })));
  return NextResponse.json(weather, { headers: { "Cache-Control": "private, max-age=300" } });
}
