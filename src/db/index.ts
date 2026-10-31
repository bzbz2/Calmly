import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { _db?: ReturnType<typeof create> };

function create() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  return drizzle(neon(process.env.DATABASE_URL), { schema });
}

// Lazy proxy so builds don't fail without env vars
export const db = new Proxy({} as ReturnType<typeof create>, {
  get(_t, prop) {
    globalForDb._db ??= create();
    return Reflect.get(globalForDb._db, prop);
  },
});

export * from "./schema";
