"use server";

import { requireSession } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";
import { getDashboardStats } from "./queries";

export async function loadDashboard() {
  const session = await requireSession();
  assertCan(session.user.role, "dashboard.read");
  return getDashboardStats();
}
