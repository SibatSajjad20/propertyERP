import "server-only";

import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, floors } from "@/db/schema/property";
import { unitPricing, units } from "@/db/schema/units";
import type { InventoryRow } from "@/components/data-table/data-table";

export async function listInventoryRows(): Promise<InventoryRow[]> {
  const rows = await db
    .select({
      id: units.id,
      unitCode: units.unitCode,
      unitNumber: units.unitNumber,
      floorName: floors.name,
      categoryName: categories.name,
      netAreaSqft: units.netAreaSqft,
      ratePerSqftPkr: units.ratePerSqftPkr,
      computedPricePkr: sql<string>`coalesce(${unitPricing.computedPricePkr}, '0.00')`,
      status: units.status,
    })
    .from(units)
    .innerJoin(floors, eq(floors.id, units.floorId))
    .innerJoin(categories, eq(categories.id, units.categoryId))
    .leftJoin(unitPricing, eq(unitPricing.unitId, units.id))
    .where(sql`${units.archivedAt} is null`)
    .orderBy(units.unitCode);

  return rows;
}

export async function getUnitById(id: string) {
  const [row] = await db
    .select({
      unit: units,
      floorName: floors.name,
      categoryName: categories.name,
      computedPricePkr: unitPricing.computedPricePkr,
    })
    .from(units)
    .innerJoin(floors, eq(floors.id, units.floorId))
    .innerJoin(categories, eq(categories.id, units.categoryId))
    .leftJoin(unitPricing, eq(unitPricing.unitId, units.id))
    .where(eq(units.id, id))
    .limit(1);

  return row ?? null;
}
