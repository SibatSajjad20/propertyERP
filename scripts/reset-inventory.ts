/**
 * Clear test inventory (units + sales children) before a fresh import.
 *
 * Dry run (default):
 *   pnpm tsx --env-file=.env scripts/reset-inventory.ts
 *
 * Apply:
 *   pnpm tsx --env-file=.env scripts/reset-inventory.ts --confirm
 *
 * Also wipe floors/blocks/categories (keeps properties + users):
 *   pnpm tsx --env-file=.env scripts/reset-inventory.ts --confirm --structure
 *
 * Production (NODE_ENV=production) additionally requires --i-know.
 */
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { count, inArray, type SQL } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";

function preloadEnv() {
  if (process.env.DATABASE_URL) return;
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  if (typeof process.loadEnvFile === "function") {
    process.loadEnvFile(envPath);
  }
}

function hasFlag(name: string) {
  return process.argv.includes(name);
}

function maskDatabaseTarget(dbUrl: string): string {
  try {
    const parsed = new URL(dbUrl);
    const host = parsed.hostname;
    const labels = host.split(".");
    const maskedHost =
      labels.length >= 2
        ? `${labels[0]!.slice(0, 2)}***.${labels.slice(1).join(".")}`
        : `${host.slice(0, 2)}***`;
    const port = parsed.port ? `:${parsed.port}` : "";
    const dbName = parsed.pathname.replace(/^\//, "") || "(default)";
    return `${maskedHost}${port}/${dbName}`;
  } catch {
    return "(unparseable DATABASE_URL)";
  }
}

const INVENTORY_AUDIT_ENTITIES = [
  "unit",
  "units",
  "payments",
  "installments",
  "import_batch",
  "booking",
  "bookings",
  "reservation",
  "reservations",
  "sale",
  "sales",
  "client",
  "clients",
  "buyback",
  "buybacks",
  "refund",
  "refunds",
  "next_of_kin",
  "inventory",
] as const;

const STRUCTURE_AUDIT_ENTITIES = ["floor", "block", "category"] as const;

type NamedTable = { name: string; table: PgTable };

async function main() {
  preloadEnv();

  const confirm = hasFlag("--confirm");
  const clearStructure = hasFlag("--structure");
  const iKnow = hasFlag("--i-know");
  const nodeEnv = process.env.NODE_ENV ?? "(unset)";

  if (nodeEnv === "production" && !iKnow) {
    throw new Error(
      "ABORT: NODE_ENV=production. Pass --i-know if you really intend to reset this database.",
    );
  }

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error(
      "ABORT: DATABASE_URL is not set. Run with: pnpm tsx --env-file=.env scripts/reset-inventory.ts",
    );
  }

  const { db, sql } = await import("../src/db");
  const { auditLog } = await import("../src/db/schema/audit");
  const { importBatches } = await import("../src/db/schema/import");
  const { blocks, categories, floors } = await import("../src/db/schema/property");
  const {
    bookings,
    buybacks,
    clients,
    installments,
    nextOfKin,
    payments,
    refunds,
    reservations,
    sales,
  } = await import("../src/db/schema/sales");
  const { rateHistory, units, unitStatusHistory } =
    await import("../src/db/schema/units");

  try {
    await runReset({
      db,
      confirm,
      clearStructure,
      nodeEnv,
      dbUrl,
      auditLog,
      importBatches,
      blocks,
      categories,
      floors,
      bookings,
      buybacks,
      clients,
      installments,
      nextOfKin,
      payments,
      refunds,
      reservations,
      sales,
      rateHistory,
      units,
      unitStatusHistory,
    });
  } finally {
    await sql.end({ timeout: 5 });
  }
}

async function runReset(args: {
  db: typeof import("../src/db").db;
  confirm: boolean;
  clearStructure: boolean;
  nodeEnv: string;
  dbUrl: string;
  auditLog: typeof import("../src/db/schema/audit").auditLog;
  importBatches: typeof import("../src/db/schema/import").importBatches;
  blocks: typeof import("../src/db/schema/property").blocks;
  categories: typeof import("../src/db/schema/property").categories;
  floors: typeof import("../src/db/schema/property").floors;
  bookings: typeof import("../src/db/schema/sales").bookings;
  buybacks: typeof import("../src/db/schema/sales").buybacks;
  clients: typeof import("../src/db/schema/sales").clients;
  installments: typeof import("../src/db/schema/sales").installments;
  nextOfKin: typeof import("../src/db/schema/sales").nextOfKin;
  payments: typeof import("../src/db/schema/sales").payments;
  refunds: typeof import("../src/db/schema/sales").refunds;
  reservations: typeof import("../src/db/schema/sales").reservations;
  sales: typeof import("../src/db/schema/sales").sales;
  rateHistory: typeof import("../src/db/schema/units").rateHistory;
  units: typeof import("../src/db/schema/units").units;
  unitStatusHistory: typeof import("../src/db/schema/units").unitStatusHistory;
}) {
  const {
    db,
    confirm,
    clearStructure,
    nodeEnv,
    dbUrl,
    auditLog,
    importBatches,
    blocks,
    categories,
    floors,
    bookings,
    buybacks,
    clients,
    installments,
    nextOfKin,
    payments,
    refunds,
    reservations,
    sales,
    rateHistory,
    units,
    unitStatusHistory,
  } = args;

  const childTables: NamedTable[] = [
    { name: "refunds", table: refunds },
    { name: "buybacks", table: buybacks },
    { name: "payments", table: payments },
    { name: "installments", table: installments },
    { name: "sales", table: sales },
    { name: "reservations", table: reservations },
    { name: "bookings", table: bookings },
    { name: "next_of_kin", table: nextOfKin },
    { name: "clients", table: clients },
    { name: "unit_status_history", table: unitStatusHistory },
    { name: "rate_history", table: rateHistory },
    { name: "import_batches", table: importBatches },
  ];

  const unitTable: NamedTable = { name: "units", table: units };
  const structureTables: NamedTable[] = clearStructure
    ? [
        { name: "floors", table: floors },
        { name: "blocks", table: blocks },
        { name: "categories", table: categories },
      ]
    : [];

  const auditEntities: string[] = [
    ...INVENTORY_AUDIT_ENTITIES,
    ...(clearStructure ? STRUCTURE_AUDIT_ENTITIES : []),
  ];
  const auditWhere: SQL = inArray(auditLog.entity, auditEntities);

  async function countTable(table: PgTable) {
    const [row] = await db.select({ n: count() }).from(table);
    return Number(row?.n ?? 0);
  }

  async function countAudit() {
    const [row] = await db.select({ n: count() }).from(auditLog).where(auditWhere);
    return Number(row?.n ?? 0);
  }

  const preview: { name: string; count: number }[] = [];
  for (const item of [...childTables, unitTable, ...structureTables]) {
    preview.push({ name: item.name, count: await countTable(item.table) });
  }
  preview.push({ name: "audit_log (unit-related)", count: await countAudit() });

  const unitCount = preview.find((row) => row.name === "units")?.count ?? 0;

  console.log(`Database: ${maskDatabaseTarget(dbUrl)}`);
  console.log(`NODE_ENV: ${nodeEnv}`);
  console.log(`Mode: ${confirm ? "CONFIRM (will delete)" : "DRY RUN (no deletes)"}`);
  console.log(
    `Structure: ${clearStructure ? "will clear floors/blocks/categories" : "preserved (floors/blocks/categories/properties)"}`,
  );
  console.log(
    "Preserved: users, sessions, auth, properties" +
      (clearStructure ? "" : ", floors, blocks, categories"),
  );
  console.log("");
  console.log(confirm ? "Rows to delete:" : "Rows that WOULD be deleted:");
  const nameWidth = Math.max(...preview.map((row) => row.name.length));
  for (const row of preview) {
    console.log(`  ${row.name.padEnd(nameWidth)}  ${row.count}`);
  }
  console.log(
    `  ${"units (audit message)".padEnd(nameWidth)}  Inventory reset: ${unitCount} units removed`,
  );

  if (!confirm) {
    console.log("");
    console.log("Dry run only. Nothing was deleted.");
    console.log(
      "Re-run with --confirm to apply. Add --structure to also wipe floors/blocks/categories.",
    );
    return;
  }

  await db.transaction(async (tx) => {
    for (const item of childTables) {
      await tx.delete(item.table);
    }
    await tx.delete(auditLog).where(auditWhere);
    await tx.delete(units);
    for (const item of structureTables) {
      await tx.delete(item.table);
    }
    await tx.insert(auditLog).values({
      actorId: null,
      entity: "inventory",
      entityId: "reset",
      action: "DELETE",
      before: { units: unitCount },
      after: {
        message: `Inventory reset: ${unitCount} units removed`,
        structureCleared: clearStructure,
      },
    });
  });

  console.log("");
  console.log("Deleted. Final counts:");
  const remaining: { name: string; count: number }[] = [];
  for (const item of [...childTables, unitTable, ...structureTables]) {
    remaining.push({ name: item.name, count: await countTable(item.table) });
  }
  remaining.push({ name: "audit_log (unit-related)", count: await countAudit() });
  for (const row of remaining) {
    console.log(`  ${row.name.padEnd(nameWidth)}  ${row.count}`);
  }

  const leftover = remaining.filter((row) =>
    row.name === "audit_log (unit-related)" ? row.count !== 1 : row.count !== 0,
  );
  if (leftover.length > 0) {
    console.warn("Warning: some tables did not land at the expected empty/reset counts.");
  } else {
    console.log("All inventory tables are empty. Audit has the single reset row.");
  }

  try {
    const { revalidatePath, revalidateTag } = await import("next/cache");
    revalidateTag("dashboard", "max");
    revalidateTag("report-summary", "max");
    revalidateTag("report-filters", "max");
    if (clearStructure) revalidateTag("structure", "max");
    revalidatePath("/inventory");
    revalidatePath("/");
    revalidatePath("/dashboard");
    if (clearStructure) revalidatePath("/structure");
    console.log(
      "Revalidated dashboard/report" +
        (clearStructure ? "/structure" : "") +
        " cache tags.",
    );
  } catch {
    console.log(
      "Skipped Next.js cache revalidation (not in the Next runtime). Hard-refresh or restart `pnpm dev` if lists look stale. Inventory has no cache tag.",
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
