import "server-only";

import { desc } from "drizzle-orm";
import { db } from "@/db";
import { importBatches } from "@/db/schema/import";

export async function listImportBatches() {
  return db.select().from(importBatches).orderBy(desc(importBatches.createdAt)).limit(20);
}
