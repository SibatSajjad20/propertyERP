"use server";

import { requireSession } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";
import {
  getDashboardBundle,
  getDashboardFilterOptions,
  getDashboardStats,
  getRecentActivity,
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

  const [bundle, activities, filterOptions] = await Promise.all([
    getDashboardBundle(filter),
    isSales ? Promise.resolve([]) : getRecentActivity(8),
    getDashboardFilterOptions(),
  ]);

  return {
    stats: bundle.stats,
    attention: bundle.attention,
    floors: bundle.floors,
    blocks: bundle.blocks,
    salesOverTime: bundle.salesOverTime,
    activities,
    filterOptions,
  };
}
