import "server-only";

import { cache } from "react";
import { and, asc, desc, eq, ilike, isNull, or, sql, type SQL } from "drizzle-orm";
import { db, withTransientDbRetry } from "@/db";
import { user } from "@/db/schema/auth";
import { blocks, categories, floors, properties } from "@/db/schema/property";
import { bookings, clients } from "@/db/schema/sales";
import { unitStatusHistory, units } from "@/db/schema/units";
import { logger } from "@/lib/logger";
import type { InventorySectionKey } from "./sections";
import {
  INVENTORY_MAX_PAGE_SIZE,
  INVENTORY_PAGE_SIZE,
  type InventoryQuery,
  type InventorySortField,
} from "./schema";
import type {
  InventoryFilterOptions,
  InventoryRow,
  InventoryTotals,
  StatusHistoryEntry,
  UnitDetail,
  UnitJumpTarget,
} from "./types";

export type {
  InventoryFilterOption,
  InventoryFilterOptions,
  InventoryRow,
  InventoryTotals,
  StatusHistoryEntry,
  UnitDetail,
  UnitJumpTarget,
} from "./types";

function computedPriceExpr() {
  return sql<string>`round((${units.ratePerSqftPkr} * coalesce(${units.grossAreaSqft}, ${units.netAreaSqft})) + coalesce(${units.priceAdjustmentPkr}, 0), 0)::numeric(14, 2)`;
}

function bookPriceExpr() {
  return sql<string>`coalesce(${units.soldPricePkr}, round((${units.ratePerSqftPkr} * coalesce(${units.grossAreaSqft}, ${units.netAreaSqft})) + coalesce(${units.priceAdjustmentPkr}, 0), 0)::numeric(14, 2), '0')`;
}

function sectionSqlCondition(section: InventorySectionKey): SQL {
  const catLower = sql`lower(trim(${categories.name}))`;
  switch (section) {
    case "mall-shops":
      return sql`(${catLower} in ('mall shops', 'mall shop') OR (${catLower} in ('shop', 'shops') AND ${floors.level} >= 1 AND ${floors.level} <= 3))`;
    case "commercial-shops":
      return sql`(${catLower} in ('commercial shops', 'commercial shop') OR (${catLower} in ('shop', 'shops') AND ${floors.level} <= 0))`;
    case "food-court":
      return sql`(${catLower} in ('food court', 'food outlets', 'food outlet') AND ${floors.level} = 3)`;
    case "kiosks":
      return sql`(${catLower} in ('kiosks', 'kiosk') AND ${floors.level} = 3)`;
    case "corporate-offices":
      return sql`(${catLower} in ('corporate offices', 'corporate office', 'office', 'offices', 'meeting room', 'cafetria', 'cafeteria') AND ${floors.level} in (4, 5))`;
    case "residential-apartments":
      return sql`(${catLower} in ('residential apartments', 'residential apartment', 'apartment', 'apartments', '1-bed', '2-bed', '3-bed') OR ${catLower} like '%apartment%')`;
  }
}

function inventoryWhere(query: Partial<InventoryQuery> = {}): SQL | undefined {
  const parts: SQL[] = [isNull(units.archivedAt)];
  const q = query ?? {};

  if (q.q) {
    const term = `%${q.q}%`;
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
  if (q.section) {
    parts.push(sectionSqlCondition(q.section));
  }
  if (q.floorId) {
    parts.push(eq(units.floorId, q.floorId));
  }
  if (q.categoryId) {
    parts.push(eq(units.categoryId, q.categoryId));
  }
  if (q.status) {
    parts.push(eq(units.status, q.status));
  }
  if (q.sellable === true) {
    parts.push(eq(units.isSellable, true));
  }
  if (q.sellable === false) {
    parts.push(eq(units.isSellable, false));
  }
  if (q.missingGross) {
    parts.push(isNull(units.grossAreaSqft));
  }

  return and(...parts);
}

function sortColumn(sort?: InventorySortField) {
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
    case "soldAt":
      return units.soldAt;
    case "updatedAt":
      return units.updatedAt;
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
  computedPricePkr: sql<string>`coalesce(${computedPriceExpr()}, '0.00')`,
  soldPricePkr: units.soldPricePkr,
  bookPricePkr: bookPriceExpr(),
  status: units.status,
  isSellable: units.isSellable,
  ownershipGroup: units.ownershipGroup,
  subOwner: units.subOwner,
  bookingRef: units.bookingRef,
  notes: units.notes,
  isMergedUnit: units.isMergedUnit,
  version: units.version,
  soldAt: units.soldAt,
  soldBy: units.soldBy,
};

export async function listInventory(query: Partial<InventoryQuery> = {}): Promise<{
  rows: InventoryRow[];
  totals: InventoryTotals;
  totalCount: number;
  nextCursor: string | null;
  pageSize: number;
}> {
  return withTransientDbRetry(async () => {
    const q = query ?? {};
    const t0 = performance.now();
    const where = inventoryWhere(q);
    const order = q.dir === "desc" ? desc(sortColumn(q.sort)) : asc(sortColumn(q.sort));
    const pageSize = Math.min(
      Math.max(q.pageSize ?? INVENTORY_PAGE_SIZE, 1),
      INVENTORY_MAX_PAGE_SIZE,
    );
    const offset = q.unpaged ? 0 : Math.max(Number(q.cursor ?? 0) || 0, 0);

    let rowsQuery = db
      .select(inventorySelect)
      .from(units)
      .innerJoin(floors, eq(floors.id, units.floorId))
      .innerJoin(categories, eq(categories.id, units.categoryId))
      .where(where)
      .orderBy(order, asc(units.unitCode));

    if (!q.unpaged) {
      rowsQuery = rowsQuery.limit(pageSize + 1).offset(offset) as typeof rowsQuery;
    }

    let rawRows: Awaited<typeof rowsQuery>;
    let totalsRow:
      | {
          count: number;
          availableCount: number;
          soldCount: number;
          missingGrossCount: number;
          netAreaSqft: string;
          valuePkr: string;
        }
      | undefined;

    if (offset > 0) {
      rawRows = await rowsQuery;
    } else {
      rawRows = await rowsQuery;
      const totalsResult = await db
        .select({
          count: sql<number>`count(*)::int`,
          availableCount: sql<number>`count(*) filter (where ${units.status} = 'AVAILABLE')::int`,
          soldCount: sql<number>`count(*) filter (where ${units.status} = 'SOLD')::int`,
          missingGrossCount: sql<number>`count(*) filter (where ${units.grossAreaSqft} is null or ${units.grossAreaSqft} = 0)::int`,
          netAreaSqft: sql<string>`coalesce(sum(${units.netAreaSqft}), 0)::numeric(14, 2)`,
          valuePkr: sql<string>`coalesce(sum(${bookPriceExpr()}), 0)::numeric(14, 2)`,
        })
        .from(units)
        .innerJoin(floors, eq(floors.id, units.floorId))
        .innerJoin(categories, eq(categories.id, units.categoryId))
        .where(where);
      totalsRow = totalsResult[0];
    }

    const durationMs = Math.round(performance.now() - t0);
    const hasMore = !q.unpaged && rawRows.length > pageSize;
    const pageRows = hasMore ? rawRows.slice(0, pageSize) : rawRows;
    const totals = totalsRow
      ? {
          count: Number(totalsRow.count ?? 0),
          availableCount: Number(totalsRow.availableCount ?? 0),
          soldCount: Number(totalsRow.soldCount ?? 0),
          missingGrossCount: Number(totalsRow.missingGrossCount ?? 0),
          netAreaSqft: totalsRow.netAreaSqft ?? "0.00",
          valuePkr: totalsRow.valuePkr ?? "0.00",
        }
      : {
          count: 0,
          availableCount: 0,
          soldCount: 0,
          missingGrossCount: 0,
          netAreaSqft: "0.00",
          valuePkr: "0.00",
        };

    logger.info(
      { durationMs, count: pageRows.length, totalCount: totals.count, query },
      "server timing: listInventory",
    );

    return {
      rows: pageRows.map((row) => ({
        ...row,
        soldAt: row.soldAt ? row.soldAt.toISOString() : null,
      })),
      totals,
      totalCount: totals.count,
      nextCursor: hasMore ? String(offset + pageSize) : null,
      pageSize,
    };
  });
}

export async function listInventoryRows(): Promise<InventoryRow[]> {
  const { rows } = await listInventory({
    missingGross: false,
    sort: "unitCode",
    dir: "asc",
    mode: "view",
    unpaged: true,
  });
  return rows;
}

let cachedInventoryFilterOptions: {
  expiresAt: number;
  data: InventoryFilterOptions;
} | null = null;
const FILTER_OPTIONS_CACHE_TTL_MS = 5 * 60_000; // 5 minutes

export function invalidateInventoryFilterOptionsCache() {
  cachedInventoryFilterOptions = null;
}

export async function getInventoryFilterOptions(): Promise<InventoryFilterOptions> {
  if (
    cachedInventoryFilterOptions &&
    cachedInventoryFilterOptions.expiresAt > Date.now()
  ) {
    return cachedInventoryFilterOptions.data;
  }

  const [floorRows, categoryRows] = await withTransientDbRetry(() =>
    Promise.all([
      db
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
        .orderBy(asc(floors.level), asc(floors.name)),
      db
        .select({
          id: categories.id,
          name: categories.name,
          isSellableDefault: categories.isSellableDefault,
        })
        .from(categories)
        .innerJoin(properties, eq(properties.id, categories.propertyId))
        .where(
          and(
            isNull(properties.archivedAt),
            sql`EXISTS (
              SELECT 1 FROM ${units}
              WHERE ${units.categoryId} = ${categories.id}
                AND ${units.archivedAt} IS NULL
            )`,
          ),
        )
        .orderBy(asc(categories.name)),
    ]),
  );

  const data: InventoryFilterOptions = {
    floors: floorRows.map((row) => ({ id: row.id, name: row.name, level: row.level })),
    categories: categoryRows,
  };

  cachedInventoryFilterOptions = {
    expiresAt: Date.now() + FILTER_OPTIONS_CACHE_TTL_MS,
    data,
  };

  return data;
}

export async function getCachedInventoryFilterOptions(): Promise<InventoryFilterOptions> {
  return getInventoryFilterOptions();
}

export const getUnitById = cache(async function getUnitById(
  id: string,
): Promise<UnitDetail | null> {
  const [row] = await db
    .select({
      unit: units,
      floorName: floors.name,
      floorLevel: floors.level,
      categoryName: categories.name,
      categoryIsSellableDefault: categories.isSellableDefault,
      computedPricePkr: sql<string>`coalesce(${computedPriceExpr()}, '0.00')`,
    })
    .from(units)
    .innerJoin(floors, eq(floors.id, units.floorId))
    .innerJoin(categories, eq(categories.id, units.categoryId))
    .where(and(eq(units.id, id), isNull(units.archivedAt)))
    .limit(1);

  if (!row) {
    return null;
  }

  return {
    ...row,
    bookPricePkr: row.unit.soldPricePkr ?? row.computedPricePkr,
  };
});

export async function listUnitStatusHistory(
  unitId: string,
): Promise<StatusHistoryEntry[]> {
  const rows = await db
    .select({
      id: unitStatusHistory.id,
      fromStatus: unitStatusHistory.fromStatus,
      toStatus: unitStatusHistory.toStatus,
      reason: unitStatusHistory.reason,
      bookingRef: unitStatusHistory.bookingRef,
      soldPricePkr: unitStatusHistory.soldPricePkr,
      actorName: user.name,
      createdAt: unitStatusHistory.createdAt,
    })
    .from(unitStatusHistory)
    .leftJoin(user, eq(user.id, unitStatusHistory.actorId))
    .where(eq(unitStatusHistory.unitId, unitId))
    .orderBy(desc(unitStatusHistory.createdAt), desc(unitStatusHistory.id));

  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
  }));
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

export type FloorUnitTile = {
  id: string;
  unitCode: string;
  unitNumber: string;
  status: typeof units.$inferSelect.status;
  grossAreaSqft: string | null;
};

export async function listFloorUnits(floorId: string): Promise<FloorUnitTile[]> {
  return db
    .select({
      id: units.id,
      unitCode: units.unitCode,
      unitNumber: units.unitNumber,
      status: units.status,
      grossAreaSqft: units.grossAreaSqft,
    })
    .from(units)
    .where(and(eq(units.floorId, floorId), isNull(units.archivedAt)))
    .orderBy(asc(units.unitNumber), asc(units.unitCode));
}

export type UnitActiveBookingInfo = {
  bookingId: string;
  bookingNo: string;
  clientName: string;
  netPrice: string;
  paidTotal: string;
};

export async function getUnitActiveBooking(
  unitId: string,
): Promise<UnitActiveBookingInfo | null> {
  const [row] = await db
    .select({
      bookingId: bookings.id,
      bookingNo: bookings.bookingNo,
      clientName: clients.fullName,
      netPrice: bookings.netPrice,
      paidTotal: bookings.paidTotal,
    })
    .from(bookings)
    .innerJoin(clients, eq(bookings.clientId, clients.id))
    .where(and(eq(bookings.unitId, unitId), eq(bookings.status, "ACTIVE")))
    .limit(1);

  return row ?? null;
}
