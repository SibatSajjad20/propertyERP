"use server";

import { requireSession } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";
import {
  getBlocksBreakdown,
  getDashboardFilterOptions,
  getDashboardStats,
  getFloorsLedger,
  getRecentActivity,
  getSalesOverTime,
} from "./queries";

export async function loadDashboard() {
  const session = await requireSession();
  assertCan(session.user.role, "dashboard.read");
  return getDashboardStats();
}

export async function getDashboardData(filter?: {
  propertyId?: string;
  blockId?: string;
}) {
  const session = await requireSession();
  assertCan(session.user.role, "dashboard.read");
  const isSales = session.user.role === "SALES";

  const [stats, floors, blocks, salesOverTime, activities, filterOptions] =
    await Promise.all([
      getDashboardStats(filter),
      getFloorsLedger(filter),
      getBlocksBreakdown(filter),
      getSalesOverTime(filter),
      isSales ? Promise.resolve([]) : getRecentActivity(10),
      getDashboardFilterOptions(),
    ]);

  return { stats, floors, blocks, salesOverTime, activities, filterOptions };
}
