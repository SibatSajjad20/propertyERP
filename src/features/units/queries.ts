import "server-only";

import { and, asc, desc, eq, ilike, isNull, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { blocks, categories, floors, properties } from "@/db/schema/property";
import { unitPricing, units } from "@/db/schema/units";
import type { InventoryQuery, InventorySortField } from "./schema";
import type {
  InventoryFilterOptions,
  InventoryRow,
  InventoryTotals,
  UnitDetail,
  UnitJumpTarget,
} from "./types";

export type {
  InventoryFilterOption,
  InventoryFilterOptions,
  InventoryRow,
  InventoryTotals,
  UnitDetail,
  UnitJumpTarget,
} from "./types";

function bookPriceExpr() {
  return sql<string>`coalesce(${units.soldPricePkr}, ${unitPricing.computedPricePkr}, '0')`;
}

function inventoryWhere(query: InventoryQuery): SQL | undefined {
  const parts: SQL[] = [isNull(units.archivedAt)];

  if (query.q) {
    const term = `%${query.q}%`;
    const search = or(
      ilike(units.unitCode, term),
      ilike(units.unitNumber, term),
      ilike(units.ownershipGroup, term),
      ilike(units.subOwner, term),
    );
    if (search) {
      parts.push(search);
    }
  }
  if (query.floorId) {
    parts.push(eq(units.floorId, query.floorId));
  }
  if (query.categoryId) {
    parts.push(eq(units.categoryId, query.categoryId));
  }
  if (query.status) {
    parts.push(eq(units.status, query.status));
  }
  if (query.sellable === true) {
    parts.push(eq(units.isSellable, true));
  }
  if (query.sellable === false) {
    parts.push(eq(units.isSellable, false));
  }
  if (query.missingGross) {
    parts.push(isNull(units.grossAreaSqft));
  }

  return and(...parts);
}

function sortColumn(sort: InventorySortField) {
  switch (sort) {
    case "unitNumber":
      return units.unitNumber;
    case "floor":
      return floors.level;
    case "category":
      return categories.name;
    case "netAreaSqft":
      return units.netAreaSqft;
    case "grossAreaSqft":
      return units.grossAreaSqft;
    case "ratePerSqftPkr":
      return units.ratePerSqftPkr;
    case "totalPrice":
      return bookPriceExpr();
    case "status":
      return units.status;
    case "ownershipGroup":
      return units.ownershipGroup;
    default:
      return units.unitCode;
  }
}

const inventorySelect = {
  id: units.id,
  unitCode: units.unitCode,
  unitNumber: units.unitNumber,
  floorId: units.floorId,
  floorName: floors.name,
  floorLevel: floors.level,
  categoryId: units.categoryId,
  categoryName: categories.name,
  netAreaSqft: units.netAreaSqft,
  grossAreaSqft: units.grossAreaSqft,
  ratePerSqftPkr: units.ratePerSqftPkr,
  priceAdjustmentPkr: units.priceAdjustmentPkr,
  priceAdjustmentReason: units.priceAdjustmentReason,
  computedPricePkr: sql<string>`coalesce(${unitPricing.computedPricePkr}, '0.00')`,
  soldPricePkr: units.soldPricePkr,
  bookPricePkr: bookPriceExpr(),
  status: units.status,
  isSellable: units.isSellable,
  ownershipGroup: units.ownershipGroup,
  subOwner: units.subOwner,
  bookingRef: units.bookingRef,
  notes: units.notes,
  version: units.version,
};

export async function listInventory(query: InventoryQuery): Promise<{
  rows: InventoryRow[];
  totals: InventoryTotals;
}> {
  const where = inventoryWhere(query);
  const order =
    query.dir === "desc" ? desc(sortColumn(query.sort)) : asc(sortColumn(query.sort));

  const rows = await db
    .select(inventorySelect)
    .from(units)
    .innerJoin(floors, eq(floors.id, units.floorId))
    .innerJoin(categories, eq(categories.id, units.categoryId))
    .leftJoin(unitPricing, eq(unitPricing.unitId, units.id))
    .where(where)
    .orderBy(order, asc(units.unitCode));

  const [totalsRow] = await db
    .select({
      count: sql<number>`count(*)::int`,
      netAreaSqft: sql<string>`coalesce(sum(${units.netAreaSqft}), 0)::numeric(14, 2)`,
      valuePkr: sql<string>`coalesce(sum(${bookPriceExpr()}), 0)::numeric(14, 2)`,
    })
    .from(units)
    .innerJoin(floors, eq(floors.id, units.floorId))
    .innerJoin(categories, eq(categories.id, units.categoryId))
    .leftJoin(unitPricing, eq(unitPricing.unitId, units.id))
    .where(where);

  return {
    rows,
    totals: {
      count: Number(totalsRow?.count ?? 0),
      netAreaSqft: totalsRow?.netAreaSqft ?? "0.00",
      valuePkr: totalsRow?.valuePkr ?? "0.00",
    },
  };
}

export async function listInventoryRows(): Promise<InventoryRow[]> {
  const { rows } = await listInventory({
    missingGross: false,
    sort: "unitCode",
    dir: "asc",
    mode: "view",
  });
  return rows;
}

export async function getInventoryFilterOptions(): Promise<InventoryFilterOptions> {
  const floorRows = await db
    .select({
      id: floors.id,
      name: floors.name,
      level: floors.level,
    })
    .from(floors)
    .innerJoin(blocks, eq(blocks.id, floors.blockId))
    .innerJoin(properties, eq(properties.id, blocks.propertyId))
    .where(
      and(
        isNull(floors.archivedAt),
        isNull(blocks.archivedAt),
        isNull(properties.archivedAt),
      ),
    )
    .orderBy(asc(floors.level), asc(floors.name));

  const categoryRows = await db
    .select({
      id: categories.id,
      name: categories.name,
      isSellableDefault: categories.isSellableDefault,
    })
    .from(categories)
    .innerJoin(properties, eq(properties.id, categories.propertyId))
    .where(isNull(properties.archivedAt))
    .orderBy(asc(categories.name));

  return {
    floors: floorRows.map((row) => ({ id: row.id, name: row.name })),
    categories: categoryRows,
  };
}

export async function getUnitById(id: string): Promise<UnitDetail | null> {
  const [row] = await db
    .select({
      unit: units,
      floorName: floors.name,
      floorLevel: floors.level,
      categoryName: categories.name,
      categoryIsSellableDefault: categories.isSellableDefault,
      computedPricePkr: sql<string>`coalesce(${unitPricing.computedPricePkr}, '0.00')`,
    })
    .from(units)
    .innerJoin(floors, eq(floors.id, units.floorId))
    .innerJoin(categories, eq(categories.id, units.categoryId))
    .leftJoin(unitPricing, eq(unitPricing.unitId, units.id))
    .where(and(eq(units.id, id), isNull(units.archivedAt)))
    .limit(1);

  if (!row) {
    return null;
  }

  return {
    ...row,
    bookPricePkr: row.unit.soldPricePkr ?? row.computedPricePkr,
  };
}

export async function searchUnitsByCode(q: string): Promise<UnitJumpTarget[]> {
  const term = `%${q}%`;
  return db
    .select({
      id: units.id,
      unitCode: units.unitCode,
      unitNumber: units.unitNumber,
    })
    .from(units)
    .where(
      and(
        isNull(units.archivedAt),
        or(ilike(units.unitCode, term), ilike(units.unitNumber, term)),
      ),
    )
    .orderBy(asc(units.unitCode))
    .limit(12);
}
