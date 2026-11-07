import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAnimalPrefs, getLastMood, getMoodRows } from "@/lib/personal/server";

// Data for personalization in the user's local time zone: the client computes
// patterns, the check-in and the weekly diary from this (see src/lib/personal).
// No message text is returned.

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [moods, last, animalPrefs] = await Promise.all([getMoodRows(userId, 56), getLastMood(userId), getAnimalPrefs(userId)]);
  return NextResponse.json({ moods, last, animalPrefs });
}
