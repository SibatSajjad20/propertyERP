import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  sql?: ReturnType<typeof postgres>;
  db?: ReturnType<typeof drizzle<typeof schema>>;
};

function createClient() {
  let url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  const lacksSslMode = !/[?&]sslmode=/i.test(url);
  if (lacksSslMode) {
    url += url.includes("?") ? "&sslmode=require" : "?sslmode=require";
  }
  const max = process.env.DB_MAX_CONNECTIONS
    ? parseInt(process.env.DB_MAX_CONNECTIONS, 10)
    : process.env.VERCEL
      ? 5
      : 10;
  return postgres(url, {
    prepare: false,
    max,
    idle_timeout: 20,
    connect_timeout: 10,
    ...(lacksSslMode ? { ssl: "require" as const } : {}),
    connection: { statement_timeout: 15000 },
  } as unknown as postgres.Options<Record<string, never>>);
}

export const sql = globalForDb.sql ?? createClient();
globalForDb.sql = sql;

export const db = globalForDb.db ?? drizzle(sql, { schema });
globalForDb.db = db;

export type Database = typeof db;

export async function pingDatabase() {
  await sql`select 1`;
  return true;
}
