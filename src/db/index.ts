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
    idle_timeout: 300,
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

const TRANSIENT_DB_CODES = new Set([
  "ECONNRESET",
  "CONNECT_TIMEOUT",
  "ETIMEDOUT",
  "CONNECTION_CLOSED",
  "EPIPE",
  "ECONNREFUSED",
  "EAI_AGAIN",
]);

export function isTransientDbError(err: unknown): boolean {
  let cur: unknown = err;
  for (let depth = 0; depth < 5 && cur && typeof cur === "object"; depth++) {
    const rec = cur as { code?: unknown; message?: unknown; cause?: unknown };
    if (typeof rec.code === "string" && TRANSIENT_DB_CODES.has(rec.code)) {
      return true;
    }
    if (
      typeof rec.message === "string" &&
      (rec.message.includes("CONNECT_TIMEOUT") ||
        rec.message.includes("ECONNRESET") ||
        rec.message.includes("ETIMEDOUT") ||
        rec.message.includes("Client network socket disconnected"))
    ) {
      return true;
    }
    cur = rec.cause;
  }
  return false;
}

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
