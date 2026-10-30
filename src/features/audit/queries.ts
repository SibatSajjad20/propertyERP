import "server-only";

import { desc } from "drizzle-orm";
import { db } from "@/db";
import { auditLog } from "@/db/schema/audit";

export async function listAuditLog() {
  return db.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(100);
}
