import "server-only";

import { count, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { units } from "@/db/schema/units";

export async function getDashboardStats() {
  const [totals] = await db
    .select({
      total: count(),
      available: sql<number>`count(*) filter (where ${units.status} = 'AVAILABLE')`,
      sold: sql<number>`count(*) filter (where ${units.status} = 'SOLD')`,
    })
    .from(units)
    .where(sql`${units.archivedAt} is null`);

  return {
    total: Number(totals?.total ?? 0),
    available: Number(totals?.available ?? 0),
    sold: Number(totals?.sold ?? 0),
  };
}

export async function getOccupancySeries() {
  const stats = await getDashboardStats();
  return [
    { label: "Available", value: stats.available, color: "var(--available)" },
    { label: "Sold", value: stats.sold, color: "var(--sold)" },
  ];
}

export async function countSellable() {
  const [row] = await db
    .select({ value: count() })
    .from(units)
    .where(eq(units.isSellable, true));
  return Number(row?.value ?? 0);
}
