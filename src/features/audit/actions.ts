"use server";

import { requireSession } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";
import { listAuditLog } from "./queries";

export async function loadAuditLog() {
  const session = await requireSession();
  assertCan(session.user.role, "audit.read");
  return listAuditLog();
}
