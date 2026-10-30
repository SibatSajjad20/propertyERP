"use server";

import { and, desc, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { auditLog } from "@/db/schema/audit";
import { importBatches } from "@/db/schema/import";
import { rateHistory, units, unitStatusHistory } from "@/db/schema/units";
import { requireSession } from "@/lib/auth";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { moneyEquals } from "@/lib/money";
import { assertCan } from "@/lib/permissions";
import { parseSpreadsheetBuffer } from "./excel";
import { listImportBatches, loadImportContext } from "./queries";
import { commitImportSchema, importPreviewSchema, rollbackBatchSchema } from "./schema";
import type { CleanedImportRow, ColumnMapping, ImportMode } from "./types";
import { detectHeaderMapping, validateImportBatch } from "./validation";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

function asAuditJson(row: object): Record<string, unknown> {
  return JSON.parse(JSON.stringify(row)) as Record<string, unknown>;
}

export async function previewImport(input: unknown) {
  const parsed = importPreviewSchema.parse(input);
  const session = await requireSession();
  assertCan(session.user.role, "units.import");
  return {
    fileName: parsed.fileName,
    message: "Import pipeline ready.",
  };
}

/**
 * Uploads a spreadsheet, parses it server-side, detects header mappings,
 * and loads database context for validation.
 */
export async function uploadAndParseSpreadsheet(formData: FormData) {
  const session = await requireSession();
  assertCan(session.user.role, "units.import");

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    throw new ValidationError("No valid spreadsheet file provided.");
  }

  const validExtensions = [".xlsx", ".xls", ".csv"];
  const lowerName = file.name.toLowerCase();
  const hasValidExt = validExtensions.some((ext) => lowerName.endsWith(ext));
  if (!hasValidExt) {
    throw new ValidationError("File must be a .xlsx, .xls, or .csv document.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = parseSpreadsheetBuffer(buffer, file.name);
  const detectedMapping = detectHeaderMapping(parsed.headers);
  const context = await loadImportContext(session.user.role);

  return {
    fileName: parsed.fileName,
    sheetName: parsed.sheetName,
    headers: parsed.headers,
    rawRows: parsed.rawRows,
    totalRows: parsed.totalRows,
    mapping: detectedMapping,
    context,
  };
}

interface RecordedUnitChange {
  unitId: string;
  unitCode: string;
  action: "CREATE" | "UPDATE";
  before: Record<string, unknown> | null;
  after: Record<string, unknown>;
}

/**
 * Commits an import batch within a single atomic database transaction.
 * Writes audit log per change, records rate history on rate changes,
 * enforces version locks, and goes through the status invariants.
 */
export async function commitImportBatch(input: unknown) {
  const parsed = commitImportSchema.parse(input);
  const session = await requireSession();
  assertCan(session.user.role, "units.import");

  const context = await loadImportContext(session.user.role);

  // Run validation on the submitted rows
  const mapping: ColumnMapping = {
    unitCode: parsed.mapping.unitCode ?? null,
    unitNumber: parsed.mapping.unitNumber ?? null,
    floor: parsed.mapping.floor ?? null,
    block: parsed.mapping.block ?? null,
    category: parsed.mapping.category ?? null,
    netAreaSqft: parsed.mapping.netAreaSqft ?? null,
    grossAreaSqft: parsed.mapping.grossAreaSqft ?? null,
    ratePerSqftPkr: parsed.mapping.ratePerSqftPkr ?? null,
    status: parsed.mapping.status ?? null,
    buyer: parsed.mapping.buyer ?? null,
    soldPricePkr: parsed.mapping.soldPricePkr ?? null,
    notes: parsed.mapping.notes ?? null,
  };
  const validationResult = validateImportBatch(
    parsed.rows.map((r) => r.originalRow),
    mapping,
    context,
    parsed.mode as ImportMode,
  );

  const errorRows = validationResult.rows.filter((r) => r.status === "ERROR");
  if (errorRows.length > 0) {
    throw new ValidationError(
      `Cannot commit batch: ${errorRows.length} rows contain validation errors. Please review and resolve errors.`,
    );
  }

  const rowsToImport = validationResult.rows
    .map((r) => r.cleaned)
    .filter((r): r is CleanedImportRow => r !== null);

  if (rowsToImport.length === 0) {
    throw new ValidationError("No valid rows to import.");
  }

  const result = await db.transaction(async (tx: Tx) => {
    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const recordedChanges: RecordedUnitChange[] = [];
    const now = new Date();

    for (const row of rowsToImport) {
      // Find matching floor
      const matchedBlock = context.blocks.find(
        (b) => b.name.toLowerCase() === row.blockName.toLowerCase(),
      );
      if (!matchedBlock) {
        throw new ValidationError(`Block "${row.blockName}" not found.`);
      }

      const matchedFloor = context.floors.find(
        (f) =>
          f.blockId === matchedBlock.id &&
          f.name.toLowerCase() === row.floorName.toLowerCase(),
      );
      if (!matchedFloor) {
        throw new ValidationError(
          `Floor "${row.floorName}" not found in block "${row.blockName}".`,
        );
      }

      // Find matching category
      let matchedCategory = context.categories.find(
        (c) => c.name.toLowerCase() === row.categoryName.toLowerCase(),
      );
      if (!matchedCategory) {
        // Fallback to Shop or first category
        matchedCategory =
          context.categories.find((c) => c.name === "Shop") ?? context.categories[0];
      }
      if (!matchedCategory) {
        throw new ValidationError("No valid category available.");
      }

      // Check if unit exists
      const [existing] = await tx
        .select()
        .from(units)
        .where(
          and(
            eq(units.propertyId, context.propertyId),
            eq(units.unitCode, row.unitCode),
            isNull(units.archivedAt),
          ),
        )
        .for("update");

      if (!existing) {
        // ------------------ CREATE NEW UNIT ------------------
        const isSold = row.status === "SOLD";
        const [created] = await tx
          .insert(units)
          .values({
            propertyId: context.propertyId,
            unitCode: row.unitCode,
            unitNumber: row.unitNumber,
            floorId: matchedFloor.id,
            categoryId: matchedCategory.id,
            netAreaSqft: row.netAreaSqft,
            grossAreaSqft: row.grossAreaSqft ?? null,
            ratePerSqftPkr: row.ratePerSqftPkr,
            priceAdjustmentPkr: "0",
            priceAdjustmentReason: null,
            soldPricePkr: isSold ? row.soldPricePkr : null,
            soldAt: isSold ? now : null,
            soldBy: isSold ? session.user.id : null,
            status: row.status,
            isSellable: row.isSellable,
            ownershipGroup: row.buyer ?? null,
            subOwner: null,
            bookingRef: isSold ? (row.buyer ?? "Excel Import") : null,
            notes: row.notes ?? null,
            version: 1,
            createdAt: now,
            updatedAt: now,
          })
          .returning();

        if (!created) {
          throw new ValidationError(`Failed to create unit ${row.unitCode}`);
        }

        if (isSold) {
          await tx.insert(unitStatusHistory).values({
            unitId: created.id,
            fromStatus: "AVAILABLE",
            toStatus: "SOLD",
            reason: "Initial import as SOLD",
            bookingRef: row.buyer ?? "Excel Import",
            soldPricePkr: row.soldPricePkr,
            actorId: session.user.id,
            createdAt: now,
          });
        }

        await tx.insert(auditLog).values({
          actorId: session.user.id,
          entity: "unit",
          entityId: created.id,
          action: isSold ? "SALE" : "CREATE",
          before: null,
          after: asAuditJson(created),
          createdAt: now,
        });

        recordedChanges.push({
          unitId: created.id,
          unitCode: created.unitCode,
          action: "CREATE",
          before: null,
          after: asAuditJson(created),
        });

        createdCount++;
      } else {
        // ------------------ UPDATE EXISTING UNIT ------------------
        if (parsed.mode === "CREATE_ONLY") {
          skippedCount++;
          continue;
        }

        // Verify version lock
        const currentVersion = existing.version;

        // If existing is SOLD and row says AVAILABLE, preserve sale
        let nextStatus = existing.status;
        let nextSoldPrice = existing.soldPricePkr;
        let nextSoldAt = existing.soldAt;
        let nextSoldBy = existing.soldBy;
        let nextBookingRef = existing.bookingRef;

        const isBecomingSold = existing.status === "AVAILABLE" && row.status === "SOLD";
        if (isBecomingSold) {
          if (!existing.isSellable) {
            throw new ValidationError(`Unit ${existing.unitCode} is not sellable.`);
          }
          nextStatus = "SOLD";
          nextSoldPrice = row.soldPricePkr;
          nextSoldAt = now;
          nextSoldBy = session.user.id;
          nextBookingRef = row.buyer ?? "Excel Import";

          await tx.insert(unitStatusHistory).values({
            unitId: existing.id,
            fromStatus: "AVAILABLE",
            toStatus: "SOLD",
            reason: "Batch import status change",
            bookingRef: nextBookingRef,
            soldPricePkr: nextSoldPrice,
            actorId: session.user.id,
            createdAt: now,
          });
        }

        // Rate change check
        const rateChanged = !moneyEquals(existing.ratePerSqftPkr, row.ratePerSqftPkr);
        if (rateChanged) {
          assertCan(session.user.role, "units.update_rate");
          await tx.insert(rateHistory).values({
            unitId: existing.id,
            oldRatePerSqftPkr: existing.ratePerSqftPkr,
            ratePerSqftPkr: row.ratePerSqftPkr,
            reason: `Excel batch import (${parsed.fileName})`,
            actorId: session.user.id,
            createdAt: now,
          });
        }

        const [updated] = await tx
          .update(units)
          .set({
            unitNumber: row.unitNumber,
            categoryId: matchedCategory.id,
            netAreaSqft: row.netAreaSqft,
            grossAreaSqft: row.grossAreaSqft ?? null,
            ratePerSqftPkr: row.ratePerSqftPkr,
            status: nextStatus,
            soldPricePkr: nextSoldPrice,
            soldAt: nextSoldAt,
            soldBy: nextSoldBy,
            bookingRef: nextBookingRef,
            notes: row.notes ?? existing.notes,
            ownershipGroup: row.buyer ?? existing.ownershipGroup,
            version: currentVersion + 1,
            updatedAt: now,
          })
          .where(and(eq(units.id, existing.id), eq(units.version, currentVersion)))
          .returning();

        if (!updated) {
          throw new ConflictError(
            `Unit ${existing.unitCode} was modified by another user concurrently.`,
          );
        }

        await tx.insert(auditLog).values({
          actorId: session.user.id,
          entity: "unit",
          entityId: updated.id,
          action: isBecomingSold ? "SALE" : "UPDATE",
          before: asAuditJson(existing),
          after: asAuditJson(updated),
          createdAt: now,
        });

        recordedChanges.push({
          unitId: updated.id,
          unitCode: updated.unitCode,
          action: "UPDATE",
          before: asAuditJson(existing),
          after: asAuditJson(updated),
        });

        updatedCount++;
      }
    }

    const allWarnings = validationResult.rows.flatMap((r) => r.warnings);

    // Record import_batches row
    const [batchRow] = await tx
      .insert(importBatches)
      .values({
        originalFilePath: parsed.fileName,
        rawRows: recordedChanges as unknown as Record<string, unknown>[],
        rowCount: parsed.rows.length,
        createdCount,
        updatedCount,
        skippedCount,
        warningCount: allWarnings.length,
        errorCount: 0,
        warnings: allWarnings,
        errors: [],
        actorId: session.user.id,
        createdAt: now,
      })
      .returning();

    if (!batchRow) {
      throw new ValidationError("Failed to record import batch receipt.");
    }

    await tx.insert(auditLog).values({
      actorId: session.user.id,
      entity: "import_batch",
      entityId: batchRow.id,
      action: "IMPORT",
      before: null,
      after: asAuditJson(batchRow),
      createdAt: now,
    });

    return {
      batchId: batchRow.id,
      createdCount,
      updatedCount,
      skippedCount,
      warningCount: allWarnings.length,
    };
  });

  logger.info(
    {
      batchId: result.batchId,
      createdCount: result.createdCount,
      updatedCount: result.updatedCount,
    },
    "excel import batch committed",
  );

  revalidatePath("/import");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");

  return result;
}

/**
 * Soft-reverts the latest active import batch using the audit trail and recorded snapshot.
 */
export async function rollbackLatestBatch(input?: unknown) {
  if (input) {
    rollbackBatchSchema.parse(input);
  }
  const session = await requireSession();
  assertCan(session.user.role, "units.import");

  const reverted = await db.transaction(async (tx: Tx) => {
    // 1. Lock the latest active batch
    const [batch] = await tx
      .select()
      .from(importBatches)
      .where(isNull(importBatches.rolledBackAt))
      .orderBy(desc(importBatches.createdAt))
      .limit(1)
      .for("update");

    if (!batch) {
      throw new NotFoundError("No active import batch available to roll back.");
    }

    const recordedChanges = (batch.rawRows ?? []) as unknown as RecordedUnitChange[];
    const now = new Date();

    for (const change of recordedChanges) {
      if (change.action === "CREATE") {
        // Soft-delete the created unit
        const [current] = await tx
          .select()
          .from(units)
          .where(and(eq(units.id, change.unitId), isNull(units.archivedAt)))
          .for("update");

        if (current) {
          const [archived] = await tx
            .update(units)
            .set({
              archivedAt: now,
              version: current.version + 1,
              updatedAt: now,
            })
            .where(eq(units.id, current.id))
            .returning();

          if (archived) {
            await tx.insert(auditLog).values({
              actorId: session.user.id,
              entity: "unit",
              entityId: current.id,
              action: "DELETE",
              before: asAuditJson(current),
              after: asAuditJson(archived),
              createdAt: now,
            });
          }
        }
      } else if (change.action === "UPDATE" && change.before) {
        // Restore prior snapshot
        const [current] = await tx
          .select()
          .from(units)
          .where(and(eq(units.id, change.unitId), isNull(units.archivedAt)))
          .for("update");

        if (current) {
          const before = change.before as typeof units.$inferSelect;

          // If status was changed from AVAILABLE to SOLD in this batch, revert back
          if (current.status === "SOLD" && before.status === "AVAILABLE") {
            await tx.insert(unitStatusHistory).values({
              unitId: current.id,
              fromStatus: "SOLD",
              toStatus: "AVAILABLE",
              reason: `Rollback of import batch ${batch.id}`,
              bookingRef: current.bookingRef,
              soldPricePkr: current.soldPricePkr,
              actorId: session.user.id,
              createdAt: now,
            });
          }

          // If rate was changed in this batch, revert back
          if (!moneyEquals(current.ratePerSqftPkr, before.ratePerSqftPkr)) {
            await tx.insert(rateHistory).values({
              unitId: current.id,
              oldRatePerSqftPkr: current.ratePerSqftPkr,
              ratePerSqftPkr: before.ratePerSqftPkr,
              reason: `Rollback of import batch ${batch.id}`,
              actorId: session.user.id,
              createdAt: now,
            });
          }

          const [restored] = await tx
            .update(units)
            .set({
              unitNumber: before.unitNumber,
              categoryId: before.categoryId,
              floorId: before.floorId,
              netAreaSqft: before.netAreaSqft,
              grossAreaSqft: before.grossAreaSqft,
              ratePerSqftPkr: before.ratePerSqftPkr,
              priceAdjustmentPkr: before.priceAdjustmentPkr,
              status: before.status,
              soldPricePkr: before.soldPricePkr,
              soldAt: before.soldAt ? new Date(before.soldAt) : null,
              soldBy: before.soldBy,
              bookingRef: before.bookingRef,
              notes: before.notes,
              ownershipGroup: before.ownershipGroup,
              subOwner: before.subOwner,
              version: current.version + 1,
              updatedAt: now,
            })
            .where(eq(units.id, current.id))
            .returning();

          if (restored) {
            await tx.insert(auditLog).values({
              actorId: session.user.id,
              entity: "unit",
              entityId: current.id,
              action: "UPDATE",
              before: asAuditJson(current),
              after: asAuditJson(restored),
              createdAt: now,
            });
          }
        }
      }
    }

    // Mark batch as rolled back
    const [updatedBatch] = await tx
      .update(importBatches)
      .set({
        rolledBackAt: now,
        rolledBackBy: session.user.id,
      })
      .where(eq(importBatches.id, batch.id))
      .returning();

    await tx.insert(auditLog).values({
      actorId: session.user.id,
      entity: "import_batch",
      entityId: batch.id,
      action: "UPDATE",
      before: asAuditJson(batch),
      after: asAuditJson(updatedBatch ?? { id: batch.id, rolledBackAt: now }),
      createdAt: now,
    });

    return { batchId: batch.id, originalFilePath: batch.originalFilePath };
  });

  logger.info({ batchId: reverted.batchId }, "import batch soft-reverted");

  revalidatePath("/import");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");

  return reverted;
}

export async function getImportBatches() {
  const session = await requireSession();
  assertCan(session.user.role, "units.import");
  return listImportBatches();
}
