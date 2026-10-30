"use server";

import { and, eq, isNull, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { auditLog } from "@/db/schema/audit";
import { blocks, categories, floors } from "@/db/schema/property";
import { rateHistory, units, unitStatusHistory } from "@/db/schema/units";
import { requireSession } from "@/lib/auth";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { computeTotalPrice, moneyEquals } from "@/lib/money";
import { assertCan } from "@/lib/permissions";
import { searchUnitsByCode } from "./queries";
import {
  archiveUnitSchema,
  changeUnitStatusSchema,
  createUnitSchema,
  searchUnitsSchema,
  STALE_UNIT_MESSAGE,
  updateUnitSchema,
} from "./schema";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

function asAuditJson(row: object): Record<string, unknown> {
  return JSON.parse(JSON.stringify(row)) as Record<string, unknown>;
}

function staleUnit(): never {
  throw new ConflictError(STALE_UNIT_MESSAGE);
}

function revalidateUnits(unitId?: string) {
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  if (unitId) {
    revalidatePath(`/units/${unitId}`);
  }
}

async function writeAudit(
  tx: Tx,
  input: {
    actorId: string;
    entityId: string;
    action: "CREATE" | "UPDATE" | "DELETE" | "STATUS_CHANGE" | "SALE" | "REVERSE_SALE";
    before: object | null;
    after: object | null;
  },
) {
  await tx.insert(auditLog).values({
    actorId: input.actorId,
    entity: "unit",
    entityId: input.entityId,
    action: input.action,
    before: input.before ? asAuditJson(input.before) : null,
    after: input.after ? asAuditJson(input.after) : null,
  });
}

async function loadFloorProperty(tx: Tx, floorId: string) {
  const [row] = await tx
    .select({
      id: floors.id,
      propertyId: blocks.propertyId,
    })
    .from(floors)
    .innerJoin(blocks, eq(blocks.id, floors.blockId))
    .where(
      and(eq(floors.id, floorId), isNull(floors.archivedAt), isNull(blocks.archivedAt)),
    )
    .limit(1);
  if (!row) {
    throw new NotFoundError("Floor not found");
  }
  return row;
}

async function loadCategory(tx: Tx, categoryId: string, propertyId: string) {
  const [row] = await tx
    .select({
      id: categories.id,
      propertyId: categories.propertyId,
      isSellableDefault: categories.isSellableDefault,
    })
    .from(categories)
    .where(eq(categories.id, categoryId))
    .limit(1);
  if (!row || row.propertyId !== propertyId) {
    throw new ValidationError("Category does not belong to this property.");
  }
  return row;
}

async function assertUniqueCode(
  tx: Tx,
  propertyId: string,
  unitCode: string,
  exceptId?: string,
) {
  const [duplicate] = await tx
    .select({ id: units.id })
    .from(units)
    .where(
      and(
        eq(units.propertyId, propertyId),
        eq(units.unitCode, unitCode),
        isNull(units.archivedAt),
        exceptId ? ne(units.id, exceptId) : undefined,
      ),
    )
    .limit(1);
  if (duplicate) {
    throw new ValidationError("A unit with this code already exists on the property.");
  }
}

function soldFieldsLocked(
  current: typeof units.$inferSelect,
  next: {
    netAreaSqft: string;
    grossAreaSqft: string | null | undefined;
    ratePerSqftPkr: string;
    priceAdjustmentPkr: string;
  },
) {
  const grossUnchanged = moneyEquals(current.grossAreaSqft, next.grossAreaSqft ?? null);
  return (
    !moneyEquals(current.netAreaSqft, next.netAreaSqft) ||
    !grossUnchanged ||
    !moneyEquals(current.ratePerSqftPkr, next.ratePerSqftPkr) ||
    !moneyEquals(current.priceAdjustmentPkr, next.priceAdjustmentPkr)
  );
}

export async function createUnit(input: unknown) {
  const parsed = createUnitSchema.parse(input);
  const session = await requireSession();
  assertCan(session.user.role, "units.manage");

  const created = await db.transaction(async (tx) => {
    const floor = await loadFloorProperty(tx, parsed.floorId);
    const category = await loadCategory(tx, parsed.categoryId, floor.propertyId);
    await assertUniqueCode(tx, floor.propertyId, parsed.unitCode);

    const adjustment = parsed.priceAdjustmentPkr ?? "0";
    const [row] = await tx
      .insert(units)
      .values({
        propertyId: floor.propertyId,
        unitCode: parsed.unitCode,
        unitNumber: parsed.unitNumber,
        floorId: parsed.floorId,
        categoryId: parsed.categoryId,
        netAreaSqft: parsed.netAreaSqft,
        grossAreaSqft: parsed.grossAreaSqft ?? null,
        ratePerSqftPkr: parsed.ratePerSqftPkr,
        priceAdjustmentPkr: adjustment,
        priceAdjustmentReason: parsed.priceAdjustmentReason ?? null,
        isSellable: parsed.isSellable ?? category.isSellableDefault,
        ownershipGroup: parsed.ownershipGroup ?? null,
        subOwner: parsed.subOwner ?? null,
        bookingRef: parsed.bookingRef ?? null,
        notes: parsed.notes ?? null,
      })
      .returning();
    if (!row) {
      throw new ValidationError("Failed to create unit");
    }

    await writeAudit(tx, {
      actorId: session.user.id,
      entityId: row.id,
      action: "CREATE",
      before: null,
      after: row,
    });
    return row;
  });

  logger.info({ unitId: created.id, actorId: session.user.id }, "unit created");
  revalidateUnits(created.id);
  return created;
}

export async function updateUnit(input: unknown) {
  const parsed = updateUnitSchema.parse(input);
  const session = await requireSession();
  assertCan(session.user.role, "units.manage");

  const updated = await db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(units)
      .where(and(eq(units.id, parsed.id), isNull(units.archivedAt)))
      .for("update");
    if (!current) {
      throw new NotFoundError("Unit not found");
    }
    if (current.version !== parsed.version) {
      staleUnit();
    }

    const adjustment = parsed.priceAdjustmentPkr ?? "0";
    const pricingTouched = soldFieldsLocked(current, {
      netAreaSqft: parsed.netAreaSqft,
      grossAreaSqft: parsed.grossAreaSqft ?? null,
      ratePerSqftPkr: parsed.ratePerSqftPkr,
      priceAdjustmentPkr: adjustment,
    });
    if (current.status === "SOLD" && session.user.role !== "ADMIN" && pricingTouched) {
      throw new ValidationError(
        "Rate, area, and adjustment on a sold unit can only be changed by an admin.",
      );
    }

    const floor = await loadFloorProperty(tx, parsed.floorId);
    if (floor.propertyId !== current.propertyId) {
      throw new ValidationError("Floor must belong to the same property.");
    }
    await loadCategory(tx, parsed.categoryId, current.propertyId);
    await assertUniqueCode(tx, current.propertyId, parsed.unitCode, current.id);

    const rateChanged = !moneyEquals(current.ratePerSqftPkr, parsed.ratePerSqftPkr);
    if (rateChanged) {
      assertCan(session.user.role, "units.update_rate");
      const reason = parsed.rateChangeReason?.trim();
      if (!reason) {
        throw new ValidationError("A reason is required when the rate changes.");
      }
      await tx.insert(rateHistory).values({
        unitId: current.id,
        oldRatePerSqftPkr: current.ratePerSqftPkr,
        ratePerSqftPkr: parsed.ratePerSqftPkr,
        reason,
        actorId: session.user.id,
      });
    }

    const [row] = await tx
      .update(units)
      .set({
        unitCode: parsed.unitCode,
        unitNumber: parsed.unitNumber,
        floorId: parsed.floorId,
        categoryId: parsed.categoryId,
        netAreaSqft: parsed.netAreaSqft,
        grossAreaSqft: parsed.grossAreaSqft ?? null,
        ratePerSqftPkr: parsed.ratePerSqftPkr,
        priceAdjustmentPkr: adjustment,
        priceAdjustmentReason: parsed.priceAdjustmentReason ?? null,
        isSellable: parsed.isSellable ?? current.isSellable,
        ownershipGroup: parsed.ownershipGroup ?? null,
        subOwner: parsed.subOwner ?? null,
        bookingRef: parsed.bookingRef ?? null,
        notes: parsed.notes ?? null,
        version: current.version + 1,
        updatedAt: new Date(),
      })
      .where(eq(units.id, current.id))
      .returning();
    if (!row) {
      staleUnit();
    }

    await writeAudit(tx, {
      actorId: session.user.id,
      entityId: row.id,
      action: "UPDATE",
      before: current,
      after: row,
    });
    return row;
  });

  logger.info({ unitId: updated.id, actorId: session.user.id }, "unit updated");
  revalidateUnits(updated.id);
  return updated;
}

export async function archiveUnit(input: unknown) {
  const parsed = archiveUnitSchema.parse(input);
  const session = await requireSession();
  assertCan(session.user.role, "units.manage");

  const archived = await db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(units)
      .where(and(eq(units.id, parsed.id), isNull(units.archivedAt)))
      .for("update");
    if (!current) {
      throw new NotFoundError("Unit not found");
    }
    if (current.version !== parsed.version) {
      staleUnit();
    }

    const [row] = await tx
      .update(units)
      .set({
        archivedAt: new Date(),
        version: current.version + 1,
        updatedAt: new Date(),
      })
      .where(eq(units.id, current.id))
      .returning();
    if (!row) {
      staleUnit();
    }

    await writeAudit(tx, {
      actorId: session.user.id,
      entityId: row.id,
      action: "DELETE",
      before: current,
      after: row,
    });
    return row;
  });

  logger.info({ unitId: archived.id, actorId: session.user.id }, "unit archived");
  revalidateUnits(archived.id);
  return archived;
}

export async function changeUnitStatus(input: unknown) {
  const parsed = changeUnitStatusSchema.parse(input);
  const session = await requireSession();
  assertCan(session.user.role, "units.change_status");

  if (parsed.toStatus === "SOLD") {
    assertCan(session.user.role, "units.sell");
  }

  const after = await db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(units)
      .where(eq(units.id, parsed.unitId))
      .for("update");

    if (!current) {
      throw new NotFoundError("Unit not found");
    }
    if (current.version !== parsed.expectedVersion) {
      staleUnit();
    }
    if (current.status === parsed.toStatus) {
      return current;
    }
    if (current.status === "SOLD" && parsed.toStatus === "AVAILABLE") {
      assertCan(session.user.role, "units.reverse_sale");
      if (!parsed.reason) {
        throw new ValidationError("A reason is required to reverse a sale");
      }
    }

    const soldPricePkr =
      parsed.toStatus === "SOLD"
        ? computeTotalPrice(
            current.ratePerSqftPkr,
            current.netAreaSqft,
            current.priceAdjustmentPkr,
          )
        : null;

    const [row] = await tx
      .update(units)
      .set({
        status: parsed.toStatus,
        soldPricePkr,
        version: current.version + 1,
        updatedAt: new Date(),
      })
      .where(eq(units.id, current.id))
      .returning();

    if (!row) {
      staleUnit();
    }

    await tx.insert(unitStatusHistory).values({
      unitId: current.id,
      fromStatus: current.status,
      toStatus: parsed.toStatus,
      reason: parsed.reason,
      actorId: session.user.id,
    });

    await writeAudit(tx, {
      actorId: session.user.id,
      entityId: current.id,
      action:
        parsed.toStatus === "SOLD"
          ? "SALE"
          : parsed.toStatus === "AVAILABLE" && current.status === "SOLD"
            ? "REVERSE_SALE"
            : "STATUS_CHANGE",
      before: current,
      after: row,
    });

    logger.info(
      {
        unitId: current.id,
        from: current.status,
        to: parsed.toStatus,
        actorId: session.user.id,
      },
      "unit status changed",
    );

    return row;
  });

  revalidateUnits(after.id);
  return after;
}

export async function searchUnits(input: unknown) {
  const parsed = searchUnitsSchema.parse(input);
  const session = await requireSession();
  assertCan(session.user.role, "units.read");
  return searchUnitsByCode(parsed.q);
}
