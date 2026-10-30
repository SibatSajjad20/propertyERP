"use server";

import { and, eq, isNull, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { auditLog } from "@/db/schema/audit";
import { blocks, floors, properties } from "@/db/schema/property";
import { units } from "@/db/schema/units";
import { requireSession } from "@/lib/auth";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
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
  updateBlockSchema,
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
