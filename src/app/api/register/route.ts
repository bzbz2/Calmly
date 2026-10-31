import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, users, profiles } from "@/db";

const schema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(200),
  password: z.string().min(8).max(200),
  birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check your details (password needs 8+ characters)." }, { status: 400 });
  }
  const { name, password, birthdate } = parsed.data;
  const email = parsed.data.email.toLowerCase();
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) return NextResponse.json({ error: "That email is already registered." }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 10);
  const [u] = await db.insert(users).values({ name, email, passwordHash }).returning({ id: users.id });
  await db.insert(profiles).values({ userId: u.id, birthdate: birthdate || null });
  return NextResponse.json({ ok: true });
}
