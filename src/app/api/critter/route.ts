import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { handleCritterRequest } from "@/lib/critter/service";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const res = handleCritterRequest(await req.json().catch(() => null));
  return NextResponse.json(res.body, { status: res.status });
}
