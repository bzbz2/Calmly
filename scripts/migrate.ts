import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";

const sql = neon(process.env.DATABASE_URL!);
const stmts = readFileSync("drizzle/0000_init.sql", "utf8").split(/;\s*\n/).map((s) => s.trim()).filter(Boolean);
for (const s of stmts) await sql.query(s);
console.log("applied", stmts.length, "statements");
console.log(await sql`select table_name from information_schema.tables where table_schema='public' order by 1`);
