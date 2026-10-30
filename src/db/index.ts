import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { withDbRetry } from "@/lib/db-errors";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  sql?: ReturnType<typeof postgres>;
};

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return postgres(url, {
    max: process.env.NODE_ENV === "production" ? 4 : 10,
    idle_timeout: 20,
    connect_timeout: 30,
    max_lifetime: 60 * 30,
    connection: {
      application_name: "sardars-mall-erp",
    },
  });
}

export const sql = globalForDb.sql ?? createClient();
if (process.env.NODE_ENV !== "production") {
  globalForDb.sql = sql;
}

export const db = drizzle(sql, { schema });
export type Database = typeof db;

export async function pingDatabase() {
  return withDbRetry(async () => {
    await sql`select 1`;
    return true;
  });
}
