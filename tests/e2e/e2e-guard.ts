import { inArray } from "drizzle-orm";
import { db } from "../../src/db";
import { blocks, floors } from "../../src/db/schema/property";
import { rateHistory, units, unitStatusHistory } from "../../src/db/schema/units";
import { isE2eStructureName, isE2eUnitCode } from "../../src/lib/e2e-records";
import { assertTestDatabase } from "../../src/lib/test-db-guard";

export function guardEnvironment() {
  assertTestDatabase();
}

export async function cleanupTestData(prefixes: string[]) {
  guardEnvironment();
  const allUnits = await db
    .select({ id: units.id, unitCode: units.unitCode })
    .from(units);
  const unitIds = allUnits
    .filter((row) => {
      if (isE2eUnitCode(row.unitCode)) {
        return true;
      }
      return prefixes.some((prefix) =>
        row.unitCode.toUpperCase().startsWith(prefix.toUpperCase()),
      );
    })
    .map((row) => row.id);

  if (unitIds.length > 0) {
    await db.delete(rateHistory).where(inArray(rateHistory.unitId, unitIds));
    await db.delete(unitStatusHistory).where(inArray(unitStatusHistory.unitId, unitIds));
    await db.delete(units).where(inArray(units.id, unitIds));
  }

  const allFloors = await db.select({ id: floors.id, name: floors.name }).from(floors);
  const floorIds = allFloors
    .filter(
      (row) =>
        isE2eStructureName(row.name) ||
        prefixes.some((prefix) =>
          row.name.toUpperCase().startsWith(prefix.toUpperCase()),
        ),
    )
    .map((row) => row.id);
  if (floorIds.length > 0) {
    await db.delete(floors).where(inArray(floors.id, floorIds));
  }

  const allBlocks = await db.select({ id: blocks.id, name: blocks.name }).from(blocks);
  const blockIds = allBlocks
    .filter(
      (row) =>
        isE2eStructureName(row.name) ||
        prefixes.some((prefix) =>
          row.name.toUpperCase().startsWith(prefix.toUpperCase()),
        ),
    )
    .map((row) => row.id);
  if (blockIds.length > 0) {
    const floorsInBlocks = await db
      .select({ id: floors.id })
      .from(floors)
      .where(inArray(floors.blockId, blockIds));
    const floorIdsInBlocks = floorsInBlocks.map((f) => f.id);
    if (floorIdsInBlocks.length > 0) {
      const unitsInFloors = await db
        .select({ id: units.id })
        .from(units)
        .where(inArray(units.floorId, floorIdsInBlocks));
      const unitIdsInFloors = unitsInFloors.map((u) => u.id);
      if (unitIdsInFloors.length > 0) {
        await db.delete(rateHistory).where(inArray(rateHistory.unitId, unitIdsInFloors));
        await db
          .delete(unitStatusHistory)
          .where(inArray(unitStatusHistory.unitId, unitIdsInFloors));
        await db.delete(units).where(inArray(units.id, unitIdsInFloors));
      }
      await db.delete(floors).where(inArray(floors.id, floorIdsInBlocks));
    }
    await db.delete(blocks).where(inArray(blocks.id, blockIds));
  }
}
