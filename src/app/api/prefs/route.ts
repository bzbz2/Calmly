import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { PHOTOS, type PhotoId } from "@/lib/critter/photos";
import { updatePrefs } from "@/lib/personal/animals";
import { getAnimalPrefs, saveAnimalPrefs } from "@/lib/personal/server";

// Learn favourite animals from "Another photo": skip = moved past it, settle = kept it.

const body = z.object({
  photoId: z.string().refine((id): id is PhotoId => id in PHOTOS, "unknown photo"),
  action: z.enum(["skip", "settle"]),
});

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid preference" }, { status: 400 });
  const prefs = updatePrefs(await getAnimalPrefs(userId), { photoId: parsed.data.photoId as PhotoId, action: parsed.data.action });
  await saveAnimalPrefs(userId, prefs);
  return NextResponse.json({ prefs });
}
