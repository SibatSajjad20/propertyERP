import "server-only";

import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { importBatches } from "@/db/schema/import";
import { blocks, categories, floors, properties } from "@/db/schema/property";
import { units } from "@/db/schema/units";
import type { UserRole } from "@/db/schema/enums";
import type { ImportBatchSummary } from "./types";
import type { ImportDbContext } from "./validation";

export async function listImportBatches(): Promise<ImportBatchSummary[]> {
  const rows = await db
    .select({
      batch: importBatches,
      actorName: user.name,
      actorEmail: user.email,
    })
    .from(importBatches)
    .leftJoin(user, eq(user.id, importBatches.actorId))
    .orderBy(desc(importBatches.createdAt))
    .limit(50);

  return rows.map(({ batch, actorName, actorEmail }) => ({
    id: batch.id,
    originalFilePath: batch.originalFilePath,
    rowCount: batch.rowCount,
    createdCount: batch.createdCount,
    updatedCount: batch.updatedCount,
    skippedCount: batch.skippedCount,
    warningCount: batch.warningCount,
    errorCount: batch.errorCount,
    warnings: (batch.warnings as string[]) ?? [],
    errors: (batch.errors as string[]) ?? [],
    actorId: batch.actorId,
    actorName: actorName ?? null,
    actorEmail: actorEmail ?? null,
    rolledBackAt: batch.rolledBackAt ?? null,
    createdAt: batch.createdAt,
  }));
}

export async function getLatestActiveImportBatch() {
  const [latest] = await db
    .select()
    .from(importBatches)
    .where(isNull(importBatches.rolledBackAt))
    .orderBy(desc(importBatches.createdAt))
    .limit(1);

  return latest ?? null;
}

export async function loadImportContext(actorRole: UserRole): Promise<ImportDbContext> {
  const [property] = await db
    .select()
    .from(properties)
    .where(isNull(properties.archivedAt))
    .orderBy(properties.createdAt)
    .limit(1);

  if (!property) {
    throw new Error("No active property found.");
  }

  const blockRows = await db
    .select({
      id: blocks.id,
      name: blocks.name,
    })
    .from(blocks)
    .where(and(eq(blocks.propertyId, property.id), isNull(blocks.archivedAt)));

  const floorRows = await db
    .select({
      id: floors.id,
      name: floors.name,
      level: floors.level,
      blockId: floors.blockId,
      blockName: blocks.name,
    })
    .from(floors)
    .innerJoin(blocks, eq(blocks.id, floors.blockId))
    .where(
      and(
        eq(blocks.propertyId, property.id),
        isNull(floors.archivedAt),
        isNull(blocks.archivedAt),
      ),
    );

  const categoryRows = await db
    .select({
      id: categories.id,
      name: categories.name,
      isSellableDefault: categories.isSellableDefault,
    })
    .from(categories)
    .where(eq(categories.propertyId, property.id));

  const unitRows = await db
    .select({
      id: units.id,
      unitCode: units.unitCode,
      unitNumber: units.unitNumber,
      floorId: units.floorId,
      floorName: floors.name,
      blockName: blocks.name,
      status: units.status,
      netAreaSqft: units.netAreaSqft,
      grossAreaSqft: units.grossAreaSqft,
      ratePerSqftPkr: units.ratePerSqftPkr,
      priceAdjustmentPkr: units.priceAdjustmentPkr,
      version: units.version,
      isSellable: units.isSellable,
    })
    .from(units)
    .innerJoin(floors, eq(floors.id, units.floorId))
    .innerJoin(blocks, eq(blocks.id, floors.blockId))
    .where(and(eq(units.propertyId, property.id), isNull(units.archivedAt)));

  return {
    propertyId: property.id,
    blocks: blockRows,
    floors: floorRows,
    categories: categoryRows,
    existingUnits: unitRows,
    actorRole,
  };
}
