import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { reservations } from "@/db/schema/sales";
import { units } from "@/db/schema/units";
import { changeUnitStatusInTx } from "@/features/units/actions";
import { logger } from "@/lib/logger";

export async function expireReservationsCron() {
  const now = new Date();
  const expired = await db
    .select({
      id: reservations.id,
      unitId: reservations.unitId,
    })
    .from(reservations)
    .where(
      and(eq(reservations.status, "ACTIVE"), sql`${reservations.expiresAt} < ${now}`),
    );

  let expiredCount = 0;
  for (const res of expired) {
    try {
      await db.transaction(async (tx) => {
        const [unit] = await tx
          .select()
          .from(units)
          .where(eq(units.id, res.unitId))
          .for("update");

        if (unit && unit.status === "RESERVED") {
          await changeUnitStatusInTx(
            tx,
            {
              unitId: unit.id,
              expectedVersion: unit.version,
              toStatus: "AVAILABLE",
              reason: "Reservation expired automatically",
            },
            { id: "system", role: "ADMIN" },
          );
        }

        await tx
          .update(reservations)
          .set({
            status: "EXPIRED",
            updatedAt: new Date(),
          })
          .where(eq(reservations.id, res.id));
      });
      expiredCount++;
    } catch (err) {
      logger.error({ err, reservationId: res.id }, "failed to expire reservation");
    }
  }

  return { expiredCount };
}
