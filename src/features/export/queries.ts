import "server-only";

import { isNull } from "drizzle-orm";
import { db } from "@/db";
import { auditLog } from "@/db/schema/audit";
import { user } from "@/db/schema/auth";
import { importBatches } from "@/db/schema/import";
import { blocks, categories, floors, properties } from "@/db/schema/property";
import { rateHistory, unitStatusHistory, units } from "@/db/schema/units";
import { listInventory } from "@/features/units/queries";
import type { InventoryQuery } from "@/features/units/schema";

function serialize<T extends Record<string, unknown>>(rows: T[]) {
  return rows.map((row) => {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      out[key] = value instanceof Date ? value.toISOString() : value;
    }
    return out;
  });
}

export async function inventoryExportRows(query: InventoryQuery) {
  const { rows } = await listInventory(query);
  return rows.map((row) => ({
    unitCode: row.unitCode,
    unitNumber: row.unitNumber,
    floor: row.floorName,
    category: row.categoryName,
    netAreaSqft: row.netAreaSqft,
    grossAreaSqft: row.grossAreaSqft,
    ratePerSqftPkr: row.ratePerSqftPkr,
    priceAdjustmentPkr: row.priceAdjustmentPkr,
    bookPricePkr: row.bookPricePkr,
    status: row.status,
    isSellable: row.isSellable,
    ownershipGroup: row.ownershipGroup,
    subOwner: row.subOwner,
    bookingRef: row.bookingRef,
    soldAt: row.soldAt,
  }));
}

export async function fullExportSheets() {
  const [
    propertyRows,
    blockRows,
    floorRows,
    categoryRows,
    unitRows,
    historyRows,
    rateRows,
    userRows,
    auditRows,
    importRows,
  ] = await Promise.all([
    db.select().from(properties).where(isNull(properties.archivedAt)),
    db.select().from(blocks).where(isNull(blocks.archivedAt)),
    db.select().from(floors).where(isNull(floors.archivedAt)),
    db.select().from(categories),
    db.select().from(units).where(isNull(units.archivedAt)),
    db.select().from(unitStatusHistory),
    db.select().from(rateHistory),
    db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      })
      .from(user),
    db.select().from(auditLog),
    db
      .select({
        id: importBatches.id,
        originalFilePath: importBatches.originalFilePath,
        rowCount: importBatches.rowCount,
        createdCount: importBatches.createdCount,
        updatedCount: importBatches.updatedCount,
        skippedCount: importBatches.skippedCount,
        warningCount: importBatches.warningCount,
        errorCount: importBatches.errorCount,
        createdAt: importBatches.createdAt,
      })
      .from(importBatches),
  ]);

  return [
    { name: "properties", rows: serialize(propertyRows as Record<string, unknown>[]) },
    { name: "blocks", rows: serialize(blockRows as Record<string, unknown>[]) },
    { name: "floors", rows: serialize(floorRows as Record<string, unknown>[]) },
    { name: "categories", rows: serialize(categoryRows as Record<string, unknown>[]) },
    { name: "units", rows: serialize(unitRows as Record<string, unknown>[]) },
    {
      name: "unit_status_history",
      rows: serialize(historyRows as Record<string, unknown>[]),
    },
    { name: "rate_history", rows: serialize(rateRows as Record<string, unknown>[]) },
    { name: "users", rows: serialize(userRows as Record<string, unknown>[]) },
    { name: "audit_log", rows: serialize(auditRows as Record<string, unknown>[]) },
    { name: "import_batches", rows: serialize(importRows as Record<string, unknown>[]) },
  ];
}
