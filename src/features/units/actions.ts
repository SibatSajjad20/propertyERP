"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLog } from "@/db/schema/audit";
import { units, unitStatusHistory } from "@/db/schema/units";
import { requireSession } from "@/lib/auth";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { computeTotalPrice } from "@/lib/money";
import { assertCan } from "@/lib/permissions";
import { changeUnitStatusSchema } from "./schema";

export async function changeUnitStatus(input: unknown) {
  const parsed = changeUnitStatusSchema.parse(input);
  const session = await requireSession();
  assertCan(session.user.role, "units.change_status");

  if (parsed.toStatus === "SOLD") {
    assertCan(session.user.role, "units.sell");
  }

  return db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(units)
      .where(eq(units.id, parsed.unitId))
      .for("update");

    if (!current) {
      throw new NotFoundError("Unit not found");
    }
    if (current.version !== parsed.expectedVersion) {
      throw new ConflictError();
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

    const [after] = await tx
      .update(units)
      .set({
        status: parsed.toStatus,
        soldPricePkr,
        version: current.version + 1,
        updatedAt: new Date(),
      })
      .where(eq(units.id, current.id))
      .returning();

    if (!after) {
      throw new ConflictError();
    }

    await tx.insert(unitStatusHistory).values({
      unitId: current.id,
      fromStatus: current.status,
      toStatus: parsed.toStatus,
      reason: parsed.reason,
      actorId: session.user.id,
    });

    await tx.insert(auditLog).values({
      actorId: session.user.id,
      entity: "unit",
      entityId: current.id,
      action:
        parsed.toStatus === "SOLD"
          ? "SALE"
          : parsed.toStatus === "AVAILABLE" && current.status === "SOLD"
            ? "REVERSE_SALE"
            : "STATUS_CHANGE",
      before: current,
      after,
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

    return after;
  });
}
