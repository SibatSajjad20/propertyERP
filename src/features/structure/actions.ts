"use server";

import { and, eq, isNull, ne, or, sql } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { db } from "@/db";
import { auditLog } from "@/db/schema/audit";
import { blocks, categories, floors, properties } from "@/db/schema/property";
import { rateHistory, units } from "@/db/schema/units";
import { requireSession } from "@/lib/auth";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { moneyEquals } from "@/lib/money";
import { assertCan } from "@/lib/permissions";
import {
  assertNoActiveUnits,
  type ArchiveKind,
  type ArchiveResult,
} from "./archive-guard";
import { floorLabelForLevel, normaliseFloorLabel } from "./floor-labels";
import {
  archiveBlockSchema,
  archiveFloorSchema,
  archivePropertySchema,
  createBlockSchema,
  createFloorSchema,
  createPropertySchema,
  type FloorRateCategorySummary,
  type FloorRateSummary,
  updateBlockSchema,
  updateFloorRatesSchema,
  updateFloorSchema,
  updatePropertySchema,
} from "./schema";

type AuditAction = "CREATE" | "UPDATE" | "DELETE";

function asAuditJson(row: object): Record<string, unknown> {
  return JSON.parse(JSON.stringify(row)) as Record<string, unknown>;
}

async function countActiveUnitsOnFloor(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  floorId: string,
): Promise<number> {
  const [row] = await tx
    .select({ count: sql<number>`count(*)::int` })
    .from(units)
    .where(and(eq(units.floorId, floorId), isNull(units.archivedAt)));
  return Number(row?.count ?? 0);
}

async function countActiveUnitsOnBlock(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  blockId: string,
): Promise<number> {
  const [row] = await tx
    .select({ count: sql<number>`count(*)::int` })
    .from(units)
    .innerJoin(floors, eq(floors.id, units.floorId))
    .where(and(eq(floors.blockId, blockId), isNull(units.archivedAt)));
  return Number(row?.count ?? 0);
}

async function countActiveUnitsOnProperty(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  propertyId: string,
): Promise<number> {
  const [row] = await tx
    .select({ count: sql<number>`count(*)::int` })
    .from(units)
    .where(and(eq(units.propertyId, propertyId), isNull(units.archivedAt)));
  return Number(row?.count ?? 0);
}

async function writeAudit(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  input: {
    actorId: string;
    entity: ArchiveKind;
    entityId: string;
    action: AuditAction;
    before: object | null;
    after: object | null;
  },
) {
  await tx.insert(auditLog).values({
    actorId: input.actorId,
    entity: input.entity,
    entityId: input.entityId,
    action: input.action,
    before: input.before ? asAuditJson(input.before) : null,
    after: input.after ? asAuditJson(input.after) : null,
  });
}

function revalidateStructure() {
  revalidateTag("structure", "max");
  revalidateTag("report-filters", "max");
  revalidateTag("dashboard", "max");
  revalidatePath("/structure");
}

export async function createProperty(input: unknown) {
  const parsed = createPropertySchema.parse(input);
  const session = await requireSession();
  assertCan(session.user.role, "structure.manage");

  const created = await db.transaction(async (tx) => {
    const [duplicate] = await tx
      .select({ id: properties.id })
      .from(properties)
      .where(and(eq(properties.name, parsed.name), isNull(properties.archivedAt)))
      .limit(1);
    if (duplicate) {
      throw new ValidationError("A property with this name already exists.");
    }

    const [row] = await tx.insert(properties).values({ name: parsed.name }).returning();
    if (!row) {
      throw new ValidationError("Failed to create property");
    }

    await writeAudit(tx, {
      actorId: session.user.id,
      entity: "property",
      entityId: row.id,
      action: "CREATE",
      before: null,
      after: row,
    });
    return row;
  });

  logger.info({ propertyId: created.id, actorId: session.user.id }, "property created");
  revalidateStructure();
  return created;
}

export async function updateProperty(input: unknown) {
  const parsed = updatePropertySchema.parse(input);
  const session = await requireSession();
  assertCan(session.user.role, "structure.manage");

  const updated = await db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(properties)
      .where(and(eq(properties.id, parsed.id), isNull(properties.archivedAt)))
      .for("update");
    if (!current) {
      throw new NotFoundError("Property not found");
    }

    const [duplicate] = await tx
      .select({ id: properties.id })
      .from(properties)
      .where(
        and(
          eq(properties.name, parsed.name),
          isNull(properties.archivedAt),
          ne(properties.id, parsed.id),
        ),
      )
      .limit(1);
    if (duplicate) {
      throw new ValidationError("A property with this name already exists.");
    }

    const [row] = await tx
      .update(properties)
      .set({ name: parsed.name, updatedAt: new Date() })
      .where(eq(properties.id, current.id))
      .returning();
    if (!row) {
      throw new NotFoundError("Property not found");
    }

    await writeAudit(tx, {
      actorId: session.user.id,
      entity: "property",
      entityId: row.id,
      action: "UPDATE",
      before: current,
      after: row,
    });
    return row;
  });

  logger.info({ propertyId: updated.id, actorId: session.user.id }, "property updated");
  revalidateStructure();
  return updated;
}

export async function archiveProperty(input: unknown): Promise<ArchiveResult> {
  const parsed = archivePropertySchema.parse(input);
  const session = await requireSession();
  assertCan(session.user.role, "structure.manage");

  const result = await db.transaction(async (tx): Promise<ArchiveResult> => {
    const [current] = await tx
      .select()
      .from(properties)
      .where(and(eq(properties.id, parsed.id), isNull(properties.archivedAt)))
      .for("update");
    if (!current) {
      throw new NotFoundError("Property not found");
    }

    const blocked = assertNoActiveUnits(
      "property",
      await countActiveUnitsOnProperty(tx, current.id),
    );
    if (!blocked.ok) {
      return blocked;
    }

    const [row] = await tx
      .update(properties)
      .set({ archivedAt: new Date(), updatedAt: new Date() })
      .where(eq(properties.id, current.id))
      .returning();
    if (!row) {
      throw new NotFoundError("Property not found");
    }

    await writeAudit(tx, {
      actorId: session.user.id,
      entity: "property",
      entityId: row.id,
      action: "DELETE",
      before: current,
      after: row,
    });
    return { ok: true };
  });

  if (!result.ok) {
    return result;
  }

  logger.info({ propertyId: parsed.id, actorId: session.user.id }, "property archived");
  revalidateStructure();
  return result;
}

export async function createBlock(input: unknown) {
  const parsed = createBlockSchema.parse(input);
  const session = await requireSession();
  assertCan(session.user.role, "structure.manage");

  const created = await db.transaction(async (tx) => {
    const [property] = await tx
      .select({ id: properties.id })
      .from(properties)
      .where(and(eq(properties.id, parsed.propertyId), isNull(properties.archivedAt)))
      .limit(1);
    if (!property) {
      throw new NotFoundError("Property not found");
    }

    const [duplicate] = await tx
      .select({ id: blocks.id })
      .from(blocks)
      .where(
        and(
          eq(blocks.propertyId, parsed.propertyId),
          eq(blocks.name, parsed.name),
          isNull(blocks.archivedAt),
        ),
      )
      .limit(1);
    if (duplicate) {
      throw new ValidationError("A block with this name already exists on the property.");
    }

    const [row] = await tx
      .insert(blocks)
      .values({ propertyId: parsed.propertyId, name: parsed.name })
      .returning();
    if (!row) {
      throw new ValidationError("Failed to create block");
    }

    await writeAudit(tx, {
      actorId: session.user.id,
      entity: "block",
      entityId: row.id,
      action: "CREATE",
      before: null,
      after: row,
    });
    return row;
  });

  logger.info({ blockId: created.id, actorId: session.user.id }, "block created");
  revalidateStructure();
  return created;
}

export async function updateBlock(input: unknown) {
  const parsed = updateBlockSchema.parse(input);
  const session = await requireSession();
  assertCan(session.user.role, "structure.manage");

  const updated = await db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(blocks)
      .where(and(eq(blocks.id, parsed.id), isNull(blocks.archivedAt)))
      .for("update");
    if (!current) {
      throw new NotFoundError("Block not found");
    }

    const [duplicate] = await tx
      .select({ id: blocks.id })
      .from(blocks)
      .where(
        and(
          eq(blocks.propertyId, current.propertyId),
          eq(blocks.name, parsed.name),
          isNull(blocks.archivedAt),
          ne(blocks.id, parsed.id),
        ),
      )
      .limit(1);
    if (duplicate) {
      throw new ValidationError("A block with this name already exists on the property.");
    }

    const [row] = await tx
      .update(blocks)
      .set({ name: parsed.name, updatedAt: new Date() })
      .where(eq(blocks.id, current.id))
      .returning();
    if (!row) {
      throw new NotFoundError("Block not found");
    }

    await writeAudit(tx, {
      actorId: session.user.id,
      entity: "block",
      entityId: row.id,
      action: "UPDATE",
      before: current,
      after: row,
    });
    return row;
  });

  logger.info({ blockId: updated.id, actorId: session.user.id }, "block updated");
  revalidateStructure();
  return updated;
}

export async function archiveBlock(input: unknown): Promise<ArchiveResult> {
  const parsed = archiveBlockSchema.parse(input);
  const session = await requireSession();
  assertCan(session.user.role, "structure.manage");

  const result = await db.transaction(async (tx): Promise<ArchiveResult> => {
    const [current] = await tx
      .select()
      .from(blocks)
      .where(and(eq(blocks.id, parsed.id), isNull(blocks.archivedAt)))
      .for("update");
    if (!current) {
      throw new NotFoundError("Block not found");
    }

    const blocked = assertNoActiveUnits(
      "block",
      await countActiveUnitsOnBlock(tx, current.id),
    );
    if (!blocked.ok) {
      return blocked;
    }

    const [row] = await tx
      .update(blocks)
      .set({ archivedAt: new Date(), updatedAt: new Date() })
      .where(eq(blocks.id, current.id))
      .returning();
    if (!row) {
      throw new NotFoundError("Block not found");
    }

    await writeAudit(tx, {
      actorId: session.user.id,
      entity: "block",
      entityId: row.id,
      action: "DELETE",
      before: current,
      after: row,
    });
    return { ok: true };
  });

  if (!result.ok) {
    return result;
  }

  logger.info({ blockId: parsed.id, actorId: session.user.id }, "block archived");
  revalidateStructure();
  return result;
}

export async function createFloor(input: unknown) {
  const parsed = createFloorSchema.parse(input);
  const session = await requireSession();
  assertCan(session.user.role, "structure.manage");

  const name = normaliseFloorLabel(parsed.name ?? floorLabelForLevel(parsed.level));
  if (!name) {
    throw new ValidationError("Floor label is required");
  }

  const created = await db.transaction(async (tx) => {
    const [block] = await tx
      .select({ id: blocks.id })
      .from(blocks)
      .where(and(eq(blocks.id, parsed.blockId), isNull(blocks.archivedAt)))
      .limit(1);
    if (!block) {
      throw new NotFoundError("Block not found");
    }

    const [dupLevel] = await tx
      .select({ id: floors.id })
      .from(floors)
      .where(
        and(
          eq(floors.blockId, parsed.blockId),
          eq(floors.level, parsed.level),
          isNull(floors.archivedAt),
        ),
      )
      .limit(1);
    if (dupLevel) {
      throw new ValidationError("A floor at this level already exists in the block.");
    }

    const [dupName] = await tx
      .select({ id: floors.id })
      .from(floors)
      .where(
        and(
          eq(floors.blockId, parsed.blockId),
          eq(floors.name, name),
          isNull(floors.archivedAt),
        ),
      )
      .limit(1);
    if (dupName) {
      throw new ValidationError("A floor with this label already exists in the block.");
    }

    const [row] = await tx
      .insert(floors)
      .values({ blockId: parsed.blockId, name, level: parsed.level })
      .returning();
    if (!row) {
      throw new ValidationError("Failed to create floor");
    }

    await writeAudit(tx, {
      actorId: session.user.id,
      entity: "floor",
      entityId: row.id,
      action: "CREATE",
      before: null,
      after: row,
    });
    return row;
  });

  logger.info({ floorId: created.id, actorId: session.user.id }, "floor created");
  revalidateStructure();
  return created;
}

export async function updateFloor(input: unknown) {
  const parsed = updateFloorSchema.parse(input);
  const session = await requireSession();
  assertCan(session.user.role, "structure.manage");

  const name = normaliseFloorLabel(parsed.name);
  if (!name) {
    throw new ValidationError("Floor label is required");
  }

  const updated = await db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(floors)
      .where(and(eq(floors.id, parsed.id), isNull(floors.archivedAt)))
      .for("update");
    if (!current) {
      throw new NotFoundError("Floor not found");
    }

    const [dupLevel] = await tx
      .select({ id: floors.id })
      .from(floors)
      .where(
        and(
          eq(floors.blockId, current.blockId),
          eq(floors.level, parsed.level),
          isNull(floors.archivedAt),
          ne(floors.id, parsed.id),
        ),
      )
      .limit(1);
    if (dupLevel) {
      throw new ValidationError("A floor at this level already exists in the block.");
    }

    const [dupName] = await tx
      .select({ id: floors.id })
      .from(floors)
      .where(
        and(
          eq(floors.blockId, current.blockId),
          eq(floors.name, name),
          isNull(floors.archivedAt),
          ne(floors.id, parsed.id),
        ),
      )
      .limit(1);
    if (dupName) {
      throw new ValidationError("A floor with this label already exists in the block.");
    }

    const [row] = await tx
      .update(floors)
      .set({ name, level: parsed.level, updatedAt: new Date() })
      .where(eq(floors.id, current.id))
      .returning();
    if (!row) {
      throw new NotFoundError("Floor not found");
    }

    await writeAudit(tx, {
      actorId: session.user.id,
      entity: "floor",
      entityId: row.id,
      action: "UPDATE",
      before: current,
      after: row,
    });
    return row;
  });

  logger.info({ floorId: updated.id, actorId: session.user.id }, "floor updated");
  revalidateStructure();
  return updated;
}

export async function archiveFloor(input: unknown): Promise<ArchiveResult> {
  const parsed = archiveFloorSchema.parse(input);
  const session = await requireSession();
  assertCan(session.user.role, "structure.manage");

  const result = await db.transaction(async (tx): Promise<ArchiveResult> => {
    const [current] = await tx
      .select()
      .from(floors)
      .where(and(eq(floors.id, parsed.id), isNull(floors.archivedAt)))
      .for("update");
    if (!current) {
      throw new NotFoundError("Floor not found");
    }

    const blocked = assertNoActiveUnits(
      "floor",
      await countActiveUnitsOnFloor(tx, current.id),
    );
    if (!blocked.ok) {
      return blocked;
    }

    const [row] = await tx
      .update(floors)
      .set({ archivedAt: new Date(), updatedAt: new Date() })
      .where(eq(floors.id, current.id))
      .returning();
    if (!row) {
      throw new NotFoundError("Floor not found");
    }

    await writeAudit(tx, {
      actorId: session.user.id,
      entity: "floor",
      entityId: row.id,
      action: "DELETE",
      before: current,
      after: row,
    });
    return { ok: true };
  });

  if (!result.ok) {
    return result;
  }

  logger.info({ floorId: parsed.id, actorId: session.user.id }, "floor archived");
  revalidateStructure();
  return result;
}

export async function getFloorRateSummary(floorId: string): Promise<FloorRateSummary> {
  const session = await requireSession();
  assertCan(session.user.role, "units.update_rate");

  const [floorRow] = await db
    .select({
      id: floors.id,
      name: floors.name,
      level: floors.level,
      blockName: blocks.name,
      propertyName: properties.name,
    })
    .from(floors)
    .innerJoin(blocks, eq(blocks.id, floors.blockId))
    .innerJoin(properties, eq(properties.id, blocks.propertyId))
    .where(and(eq(floors.id, floorId), isNull(floors.archivedAt)));

  if (!floorRow) {
    throw new NotFoundError("Floor not found");
  }

  const unitRows = await db
    .select({
      id: units.id,
      status: units.status,
      ratePerSqftPkr: units.ratePerSqftPkr,
      categoryId: units.categoryId,
      categoryName: categories.name,
    })
    .from(units)
    .innerJoin(categories, eq(categories.id, units.categoryId))
    .where(and(eq(units.floorId, floorId), isNull(units.archivedAt)));

  let availableUnits = 0;
  let reservedUnits = 0;
  let bookedUnits = 0;
  let soldUnits = 0;

  const categoryMap = new Map<
    string,
    {
      categoryId: string;
      categoryName: string;
      totalUnits: number;
      availableUnits: number;
      rates: number[];
    }
  >();

  const allRates: number[] = [];

  for (const u of unitRows) {
    if (u.status === "AVAILABLE") availableUnits++;
    else if (u.status === "RESERVED") reservedUnits++;
    else if (u.status === "BOOKED") bookedUnits++;
    else if (u.status === "SOLD") soldUnits++;

    const rateNum = Number(u.ratePerSqftPkr) || 0;
    if (rateNum > 0) {
      allRates.push(rateNum);
    }

    let cat = categoryMap.get(u.categoryId);
    if (!cat) {
      cat = {
        categoryId: u.categoryId,
        categoryName: u.categoryName,
        totalUnits: 0,
        availableUnits: 0,
        rates: [],
      };
      categoryMap.set(u.categoryId, cat);
    }
    cat.totalUnits++;
    if (u.status === "AVAILABLE" || u.status === "RESERVED") {
      cat.availableUnits++;
    }
    if (rateNum > 0) {
      cat.rates.push(rateNum);
    }
  }

  const catList: FloorRateCategorySummary[] = Array.from(categoryMap.values())
    .map((c) => ({
      categoryId: c.categoryId,
      categoryName: c.categoryName,
      totalUnits: c.totalUnits,
      availableUnits: c.availableUnits,
      minRate: c.rates.length ? Math.min(...c.rates).toFixed(2) : null,
      maxRate: c.rates.length ? Math.max(...c.rates).toFixed(2) : null,
    }))
    .sort((a, b) => a.categoryName.localeCompare(b.categoryName));

  return {
    floorId: floorRow.id,
    floorName: floorRow.name,
    floorLevel: floorRow.level,
    blockName: floorRow.blockName,
    propertyName: floorRow.propertyName,
    totalUnits: unitRows.length,
    availableUnits,
    reservedUnits,
    bookedUnits,
    soldUnits,
    categories: catList,
    overallMinRate: allRates.length ? Math.min(...allRates).toFixed(2) : null,
    overallMaxRate: allRates.length ? Math.max(...allRates).toFixed(2) : null,
  };
}

export async function updateFloorRates(input: unknown) {
  const parsed = updateFloorRatesSchema.parse(input);
  const session = await requireSession();
  assertCan(session.user.role, "units.update_rate");

  if (parsed.includeSoldBooked && session.user.role !== "ADMIN") {
    throw new ValidationError(
      "Only administrators can update rates on sold or booked units.",
    );
  }

  const cleanRate = parsed.newRatePerSqftPkr.replace(/,/g, "").trim();

  const result = await db.transaction(async (tx) => {
    // 1. Verify floor exists
    const [floor] = await tx
      .select({ id: floors.id, name: floors.name, level: floors.level })
      .from(floors)
      .where(and(eq(floors.id, parsed.floorId), isNull(floors.archivedAt)))
      .for("update");
    if (!floor) {
      throw new NotFoundError("Floor not found");
    }

    // 2. Build unit conditions
    const conditions = [eq(units.floorId, parsed.floorId), isNull(units.archivedAt)];
    if (parsed.categoryId) {
      conditions.push(eq(units.categoryId, parsed.categoryId));
    }
    if (!parsed.includeSoldBooked) {
      const statusCondition = or(
        eq(units.status, "AVAILABLE"),
        eq(units.status, "RESERVED"),
      );
      if (statusCondition) {
        conditions.push(statusCondition);
      }
    }

    // 3. Query matching units
    const targetUnits = await tx
      .select({
        id: units.id,
        unitCode: units.unitCode,
        ratePerSqftPkr: units.ratePerSqftPkr,
        status: units.status,
        version: units.version,
      })
      .from(units)
      .where(and(...conditions))
      .for("update");

    if (targetUnits.length === 0) {
      return {
        ok: true,
        updatedCount: 0,
        floorName: floor.name,
        message: "No eligible units found on this floor to update.",
      };
    }

    // 4. Filter units that actually have a rate change
    const unitsToChange = targetUnits.filter(
      (u) => !moneyEquals(u.ratePerSqftPkr, cleanRate),
    );

    if (unitsToChange.length === 0) {
      return {
        ok: true,
        updatedCount: 0,
        floorName: floor.name,
        message: "All selected units already have this rate.",
      };
    }

    // 5. Batch insert rateHistory
    const historyRows = unitsToChange.map((u) => ({
      unitId: u.id,
      oldRatePerSqftPkr: u.ratePerSqftPkr,
      ratePerSqftPkr: cleanRate,
      reason: parsed.reason,
      actorId: session.user.id,
    }));
    await tx.insert(rateHistory).values(historyRows);

    // 6. Update units
    const now = new Date();
    for (const u of unitsToChange) {
      await tx
        .update(units)
        .set({
          ratePerSqftPkr: cleanRate,
          version: u.version + 1,
          updatedAt: now,
        })
        .where(eq(units.id, u.id));
    }

    // 7. Write audit log
    await writeAudit(tx, {
      actorId: session.user.id,
      entity: "floor",
      entityId: floor.id,
      action: "UPDATE",
      before: null,
      after: {
        action: "UPDATE_FLOOR_RATES",
        floorId: floor.id,
        floorName: floor.name,
        categoryId: parsed.categoryId ?? null,
        newRatePerSqftPkr: cleanRate,
        reason: parsed.reason,
        unitsUpdatedCount: unitsToChange.length,
        includeSoldBooked: parsed.includeSoldBooked,
      },
    });

    return {
      ok: true,
      updatedCount: unitsToChange.length,
      floorName: floor.name,
      message: `Successfully updated ${unitsToChange.length} unit${unitsToChange.length === 1 ? "" : "s"} on ${floor.name} to Rs ${cleanRate}/sqft.`,
    };
  });

  logger.info(
    {
      actorId: session.user.id,
      floorId: parsed.floorId,
      updatedCount: result.updatedCount,
      rate: cleanRate,
    },
    "floor rates updated",
  );

  revalidateTag("structure", "max");
  revalidateTag("inventory", "max");
  revalidateTag("dashboard", "max");
  revalidateTag("report-filters", "max");
  revalidatePath("/structure");
  revalidatePath("/inventory");

  return result;
}
