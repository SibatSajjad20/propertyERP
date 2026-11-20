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
    : 10;
  return postgres(url, {
    prepare: false,
    fetch_types: false,
    max,
    idle_timeout: 20,
    max_lifetime: 60 * 30,
    keep_alive: 30,
    connect_timeout: 30,
    ...(lacksSslMode ? { ssl: "require" as const } : {}),
    connection: { statement_timeout: 45000 },
  } as unknown as postgres.Options<Record<string, never>>);
}

export const sql = globalForDb.sql ?? createClient();
globalForDb.sql = sql;

export const db = globalForDb.db ?? drizzle(sql, { schema });
globalForDb.db = db;

export type Database = typeof db;

export { isTransientDbError } from "@/lib/errors";
import { isTransientDbError } from "@/lib/errors";

export async function withTransientDbRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt >= retries || !isTransientDbError(err)) {
        throw err;
      }
      await new Promise((r) => setTimeout(r, 250 * (attempt + 1)));
    }
  }
  throw lastError;
}

export async function pingDatabase() {
  await sql`select 1`;
  return true;
}
