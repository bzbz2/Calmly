import { neon } from "@neondatabase/serverless";
import { readdirSync, readFileSync } from "node:fs";

const sql = neon(process.env.DATABASE_URL!);
const files = readdirSync("drizzle").filter((f) => f.endsWith(".sql")).sort();
for (const f of files) {
  const stmts = readFileSync(`drizzle/${f}`, "utf8").split(/;\s*\n/).map((s) => s.trim()).filter(Boolean);
  for (const s of stmts) await sql.query(s);
  console.log("applied", f, `(${stmts.length} statements)`);
}
