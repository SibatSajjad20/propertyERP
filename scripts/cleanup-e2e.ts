import { inArray } from "drizzle-orm";
import { db, sql } from "../src/db";
import { blocks, floors } from "../src/db/schema/property";
import { rateHistory, units, unitStatusHistory } from "../src/db/schema/units";
import { isE2eStructureName, isE2eUnitCode } from "../src/lib/e2e-records";
import { isAllowProductionFlag, isApplyFlag } from "../src/lib/test-db-guard";

function looksLikeProduction(dbUrl: string): boolean {
  try {
    const host = new URL(dbUrl).hostname.toLowerCase();
    return host.includes("prod") || host.includes("production") || host.includes("live");
  } catch {
    return true;
  }
}

async function main() {
  const apply = isApplyFlag(process.argv);
  const allowProduction = isAllowProductionFlag(process.argv);
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("ABORT: DATABASE_URL is not set");
  }

  if (
    (process.env.VERCEL_ENV === "production" || looksLikeProduction(dbUrl)) &&
    !allowProduction
  ) {
    throw new Error(
      "ABORT: Refusing production without --allow-production. Dry-run on a copy first, then re-run with --apply --allow-production.",
    );
  }

  const allBlocks = await db.select({ id: blocks.id, name: blocks.name }).from(blocks);
  const targetBlocks = allBlocks.filter((row) => isE2eStructureName(row.name));
  const blockIds = targetBlocks.map((row) => row.id);

  const allFloors = await db
    .select({ id: floors.id, name: floors.name, blockId: floors.blockId })
    .from(floors);
  const targetFloors = allFloors.filter(
    (row) => isE2eStructureName(row.name) || blockIds.includes(row.blockId),
  );
  const floorIds = targetFloors.map((row) => row.id);

  const allUnits = await db
    .select({ id: units.id, unitCode: units.unitCode, floorId: units.floorId })
    .from(units);
  const targetUnits = allUnits.filter(
    (row) => isE2eUnitCode(row.unitCode) || floorIds.includes(row.floorId),
  );

  console.log("E2E cleanup preview (review these rows before --apply)");
  console.log(`  units: ${targetUnits.length}`);
  for (const row of targetUnits) {
    console.log(`    ${row.unitCode}  ${row.id}`);
  }
  console.log(`  floors: ${targetFloors.length}`);
  for (const row of targetFloors) {
    console.log(`    ${row.name}  ${row.id}`);
  }
  console.log(`  blocks: ${targetBlocks.length}`);
  for (const row of targetBlocks) {
    console.log(`    ${row.name}  ${row.id}`);
  }

  if (!apply) {
    console.log("\nDry run only. Re-run with --apply to delete the rows above.");
    return;
  }

  const unitIds = targetUnits.map((row) => row.id);
  if (unitIds.length > 0) {
    await db.delete(rateHistory).where(inArray(rateHistory.unitId, unitIds));
    await db.delete(unitStatusHistory).where(inArray(unitStatusHistory.unitId, unitIds));
    await db.delete(units).where(inArray(units.id, unitIds));
  }
  if (floorIds.length > 0) {
    await db.delete(floors).where(inArray(floors.id, floorIds));
  }
  if (blockIds.length > 0) {
    await db.delete(blocks).where(inArray(blocks.id, blockIds));
  }

  console.log("Deleted the previewed E2E rows.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await sql.end({ timeout: 5 });
  });
