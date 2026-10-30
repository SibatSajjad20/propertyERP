import "server-only";

import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { auditLog } from "@/db/schema/audit";
import { user } from "@/db/schema/auth";
import { blocks, categories, floors, properties } from "@/db/schema/property";
import { units, unitStatusHistory } from "@/db/schema/units";

export interface DashboardStats {
  total: number;
  available: number;
  sold: number;
  soldPercent: number;
  availableValuePkr: string;
  soldValuePkr: string;
}

export interface FloorLedgerRow {
  floorId: string;
  floorName: string;
  level: number;
  blockId: string;
  blockName: string;
  total: number;
  available: number;
  sold: number;
  soldPercent: number;
  availableValuePkr: string;
  soldValuePkr: string;
  totalValuePkr: string;
}

export interface BlockBreakdownRow {
  blockId: string;
  blockName: string;
  total: number;
  available: number;
  sold: number;
  soldPercent: number;
  availableValuePkr: string;
  soldValuePkr: string;
  totalValuePkr: string;
}

export interface SalesOverTimePoint {
  month: string;
  label: string;
  count: number;
  volumePkr: string;
}

export interface RecentActivityItem {
  id: string;
  actorName: string;
  action: string;
  entity: string;
  targetName: string;
  createdAt: Date;
}

export interface DashboardFilterOptions {
  properties: { id: string; name: string }[];
  blocks: { id: string; propertyId: string; name: string }[];
}

export interface InventoryExportRow {
  unitCode: string;
  floorName: string;
  level: number;
  blockName: string;
  categoryName: string;
  status: string;
  netAreaSqft: string;
  grossAreaSqft: string | null;
  ratePerSqftPkr: string;
  priceAdjustmentPkr: string;
  totalPricePkr: string;
  isSellable: boolean;
  ownershipGroup: string | null;
  bookingRef: string | null;
}

export interface SoldUnitsExportRow {
  unitCode: string;
  floorName: string;
  level: number;
  blockName: string;
  categoryName: string;
  netAreaSqft: string;
  ratePerSqftPkr: string;
  soldPricePkr: string;
  soldAt: Date | null;
  soldByName: string | null;
  bookingRef: string | null;
  ownershipGroup: string | null;
}

export interface FloorSummaryExportRow {
  floorName: string;
  level: number;
  blockName: string;
  total: number;
  available: number;
  sold: number;
  soldPercent: number;
  availableValuePkr: string;
  soldValuePkr: string;
  totalValuePkr: string;
}

export async function getDashboardStats(filter?: {
  propertyId?: string;
  blockId?: string;
}): Promise<DashboardStats> {
  const conditions = [isNull(units.archivedAt)];
  if (filter?.propertyId) {
    conditions.push(eq(units.propertyId, filter.propertyId));
  }
  if (filter?.blockId) {
    conditions.push(eq(floors.blockId, filter.blockId));
  }

  const [row] = await db
    .select({
      total: sql<number>`count(${units.id})`,
      available: sql<number>`count(${units.id}) filter (where ${units.status} = 'AVAILABLE')`,
      sold: sql<number>`count(${units.id}) filter (where ${units.status} = 'SOLD')`,
      availableValuePkr: sql<string>`coalesce(sum(case when ${units.status} = 'AVAILABLE' then round((${units.ratePerSqftPkr} * ${units.netAreaSqft}) + coalesce(${units.priceAdjustmentPkr}, 0), 0) else 0 end), 0)::text`,
      soldValuePkr: sql<string>`coalesce(sum(case when ${units.status} = 'SOLD' then coalesce(${units.soldPricePkr}, round((${units.ratePerSqftPkr} * ${units.netAreaSqft}) + coalesce(${units.priceAdjustmentPkr}, 0), 0)) else 0 end), 0)::text`,
    })
    .from(units)
    .innerJoin(floors, and(eq(units.floorId, floors.id), isNull(floors.archivedAt)))
    .innerJoin(blocks, and(eq(floors.blockId, blocks.id), isNull(blocks.archivedAt)))
    .where(and(...conditions));

  const total = Number(row?.total ?? 0);
  const available = Number(row?.available ?? 0);
  const sold = Number(row?.sold ?? 0);
  const soldPercent = total > 0 ? (sold / total) * 100 : 0;

  return {
    total,
    available,
    sold,
    soldPercent,
    availableValuePkr: row?.availableValuePkr ?? "0",
    soldValuePkr: row?.soldValuePkr ?? "0",
  };
}

export async function getFloorsLedger(filter?: {
  propertyId?: string;
  blockId?: string;
}): Promise<FloorLedgerRow[]> {
  const floorConditions = [isNull(floors.archivedAt), isNull(blocks.archivedAt)];
  if (filter?.propertyId) {
    floorConditions.push(eq(blocks.propertyId, filter.propertyId));
  }
  if (filter?.blockId) {
    floorConditions.push(eq(floors.blockId, filter.blockId));
  }

  const rows = await db
    .select({
      floorId: floors.id,
      floorName: floors.name,
      level: floors.level,
      blockId: blocks.id,
      blockName: blocks.name,
      total: sql<number>`count(${units.id})`,
      available: sql<number>`count(${units.id}) filter (where ${units.status} = 'AVAILABLE')`,
      sold: sql<number>`count(${units.id}) filter (where ${units.status} = 'SOLD')`,
      availableValuePkr: sql<string>`coalesce(sum(case when ${units.status} = 'AVAILABLE' then round((${units.ratePerSqftPkr} * ${units.netAreaSqft}) + coalesce(${units.priceAdjustmentPkr}, 0), 0) else 0 end), 0)::text`,
      soldValuePkr: sql<string>`coalesce(sum(case when ${units.status} = 'SOLD' then coalesce(${units.soldPricePkr}, round((${units.ratePerSqftPkr} * ${units.netAreaSqft}) + coalesce(${units.priceAdjustmentPkr}, 0), 0)) else 0 end), 0)::text`,
      totalValuePkr: sql<string>`coalesce(sum(case when ${units.status} = 'SOLD' then coalesce(${units.soldPricePkr}, round((${units.ratePerSqftPkr} * ${units.netAreaSqft}) + coalesce(${units.priceAdjustmentPkr}, 0), 0)) else round((${units.ratePerSqftPkr} * ${units.netAreaSqft}) + coalesce(${units.priceAdjustmentPkr}, 0), 0) end), 0)::text`,
    })
    .from(floors)
    .innerJoin(blocks, eq(floors.blockId, blocks.id))
    .leftJoin(units, sql`${units.floorId} = ${floors.id} and ${units.archivedAt} is null`)
    .where(and(...floorConditions))
    .groupBy(floors.id, floors.name, floors.level, blocks.id, blocks.name)
    .orderBy(desc(floors.level), asc(floors.name));

  return rows.map((r) => {
    const total = Number(r.total);
    const sold = Number(r.sold);
    return {
      floorId: r.floorId,
      floorName: r.floorName,
      level: r.level,
      blockId: r.blockId,
      blockName: r.blockName,
      total,
      available: Number(r.available),
      sold,
      soldPercent: total > 0 ? (sold / total) * 100 : 0,
      availableValuePkr: r.availableValuePkr,
      soldValuePkr: r.soldValuePkr,
      totalValuePkr: r.totalValuePkr,
    };
  });
}

export async function getBlocksBreakdown(filter?: {
  propertyId?: string;
  blockId?: string;
}): Promise<BlockBreakdownRow[]> {
  const blockConditions = [isNull(blocks.archivedAt)];
  if (filter?.propertyId) {
    blockConditions.push(eq(blocks.propertyId, filter.propertyId));
  }
  if (filter?.blockId) {
    blockConditions.push(eq(blocks.id, filter.blockId));
  }

  const rows = await db
    .select({
      blockId: blocks.id,
      blockName: blocks.name,
      total: sql<number>`count(${units.id})`,
      available: sql<number>`count(${units.id}) filter (where ${units.status} = 'AVAILABLE')`,
      sold: sql<number>`count(${units.id}) filter (where ${units.status} = 'SOLD')`,
      availableValuePkr: sql<string>`coalesce(sum(case when ${units.status} = 'AVAILABLE' then round((${units.ratePerSqftPkr} * ${units.netAreaSqft}) + coalesce(${units.priceAdjustmentPkr}, 0), 0) else 0 end), 0)::text`,
      soldValuePkr: sql<string>`coalesce(sum(case when ${units.status} = 'SOLD' then coalesce(${units.soldPricePkr}, round((${units.ratePerSqftPkr} * ${units.netAreaSqft}) + coalesce(${units.priceAdjustmentPkr}, 0), 0)) else 0 end), 0)::text`,
      totalValuePkr: sql<string>`coalesce(sum(case when ${units.status} = 'SOLD' then coalesce(${units.soldPricePkr}, round((${units.ratePerSqftPkr} * ${units.netAreaSqft}) + coalesce(${units.priceAdjustmentPkr}, 0), 0)) else round((${units.ratePerSqftPkr} * ${units.netAreaSqft}) + coalesce(${units.priceAdjustmentPkr}, 0), 0) end), 0)::text`,
    })
    .from(blocks)
    .leftJoin(
      floors,
      sql`${floors.blockId} = ${blocks.id} and ${floors.archivedAt} is null`,
    )
    .leftJoin(units, sql`${units.floorId} = ${floors.id} and ${units.archivedAt} is null`)
    .where(and(...blockConditions))
    .groupBy(blocks.id, blocks.name)
    .orderBy(asc(blocks.name));

  return rows.map((r) => {
    const total = Number(r.total);
    const sold = Number(r.sold);
    return {
      blockId: r.blockId,
      blockName: r.blockName,
      total,
      available: Number(r.available),
      sold,
      soldPercent: total > 0 ? (sold / total) * 100 : 0,
      availableValuePkr: r.availableValuePkr,
      soldValuePkr: r.soldValuePkr,
      totalValuePkr: r.totalValuePkr,
    };
  });
}

export async function getSalesOverTime(filter?: {
  propertyId?: string;
  blockId?: string;
}): Promise<SalesOverTimePoint[]> {
  const salesConditions = [
    eq(unitStatusHistory.toStatus, "SOLD"),
    isNull(units.archivedAt),
    isNull(floors.archivedAt),
    isNull(blocks.archivedAt),
  ];
  if (filter?.propertyId) {
    salesConditions.push(eq(blocks.propertyId, filter.propertyId));
  }
  if (filter?.blockId) {
    salesConditions.push(eq(floors.blockId, filter.blockId));
  }

  const rows = await db
    .select({
      month: sql<string>`to_char(date_trunc('month', ${unitStatusHistory.createdAt}), 'YYYY-MM')`,
      count: sql<number>`count(${unitStatusHistory.id})::int`,
      volumePkr: sql<string>`coalesce(sum(coalesce(${unitStatusHistory.soldPricePkr}, round((${units.ratePerSqftPkr} * ${units.netAreaSqft}) + coalesce(${units.priceAdjustmentPkr}, 0), 0))), 0)::text`,
    })
    .from(unitStatusHistory)
    .innerJoin(units, eq(unitStatusHistory.unitId, units.id))
    .innerJoin(floors, eq(units.floorId, floors.id))
    .innerJoin(blocks, eq(floors.blockId, blocks.id))
    .where(and(...salesConditions))
    .groupBy(sql`date_trunc('month', ${unitStatusHistory.createdAt})`)
    .orderBy(sql`date_trunc('month', ${unitStatusHistory.createdAt}) asc`);

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return rows.map((r) => {
    let label = r.month;
    const parts = r.month.split("-");
    if (parts.length === 2) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1] ?? "1", 10) - 1;
      const mName = monthNames[monthIdx] ?? parts[1];
      label = `${mName} ${year}`;
    }
    return {
      month: r.month,
      label,
      count: Number(r.count),
      volumePkr: r.volumePkr,
    };
  });
}

export async function getRecentActivity(limit = 10): Promise<RecentActivityItem[]> {
  const rows = await db
    .select({
      id: auditLog.id,
      actorId: auditLog.actorId,
      actorName: user.name,
      action: auditLog.action,
      entity: auditLog.entity,
      entityId: auditLog.entityId,
      before: auditLog.before,
      after: auditLog.after,
      createdAt: auditLog.createdAt,
      unitCode: units.unitCode,
      blockName: blocks.name,
      floorName: floors.name,
      propertyName: properties.name,
    })
    .from(auditLog)
    .leftJoin(user, eq(auditLog.actorId, user.id))
    .leftJoin(
      units,
      sql`${auditLog.entity} = 'unit' and ${auditLog.entityId} = ${units.id}::text`,
    )
    .leftJoin(
      blocks,
      sql`${auditLog.entity} = 'block' and ${auditLog.entityId} = ${blocks.id}::text`,
    )
    .leftJoin(
      floors,
      sql`${auditLog.entity} = 'floor' and ${auditLog.entityId} = ${floors.id}::text`,
    )
    .leftJoin(
      properties,
      sql`${auditLog.entity} = 'property' and ${auditLog.entityId} = ${properties.id}::text`,
    )
    .orderBy(desc(auditLog.createdAt))
    .limit(limit);

  return rows.map((r) => {
    let targetName = "";
    const after = r.after as Record<string, unknown> | null;
    const before = r.before as Record<string, unknown> | null;

    if (r.entity === "unit") {
      targetName =
        r.unitCode ??
        (typeof after?.unitCode === "string" ? after.unitCode : undefined) ??
        (typeof before?.unitCode === "string" ? before.unitCode : undefined) ??
        "Unit";
    } else if (r.entity === "block") {
      targetName =
        r.blockName ??
        (typeof after?.name === "string" ? after.name : undefined) ??
        (typeof before?.name === "string" ? before.name : undefined) ??
        "Block";
    } else if (r.entity === "floor") {
      targetName =
        r.floorName ??
        (typeof after?.name === "string" ? after.name : undefined) ??
        (typeof before?.name === "string" ? before.name : undefined) ??
        "Floor";
    } else if (r.entity === "property") {
      targetName =
        r.propertyName ??
        (typeof after?.name === "string" ? after.name : undefined) ??
        (typeof before?.name === "string" ? before.name : undefined) ??
        "Property";
    } else {
      targetName = r.entity.charAt(0).toUpperCase() + r.entity.slice(1);
    }

    // Safeguard: Never return a raw UUID
    if (/^[0-9a-fA-F-]{36}$/.test(targetName)) {
      targetName = r.entity.charAt(0).toUpperCase() + r.entity.slice(1);
    }

    return {
      id: r.id,
      actorName: r.actorName ?? "System",
      action: r.action,
      entity: r.entity,
      targetName,
      createdAt: r.createdAt,
    };
  });
}

export async function getDashboardFilterOptions(): Promise<DashboardFilterOptions> {
  const [props, blks] = await Promise.all([
    db
      .select({ id: properties.id, name: properties.name })
      .from(properties)
      .where(isNull(properties.archivedAt))
      .orderBy(asc(properties.name)),
    db
      .select({ id: blocks.id, propertyId: blocks.propertyId, name: blocks.name })
      .from(blocks)
      .where(isNull(blocks.archivedAt))
      .orderBy(asc(blocks.name)),
  ]);

  return { properties: props, blocks: blks };
}

export async function getExportInventoryData(filter?: {
  propertyId?: string;
  blockId?: string;
}): Promise<InventoryExportRow[]> {
  const conditions = [isNull(units.archivedAt)];
  if (filter?.propertyId) {
    conditions.push(eq(units.propertyId, filter.propertyId));
  }
  if (filter?.blockId) {
    conditions.push(eq(floors.blockId, filter.blockId));
  }

  const rows = await db
    .select({
      unitCode: units.unitCode,
      floorName: floors.name,
      level: floors.level,
      blockName: blocks.name,
      categoryName: categories.name,
      status: units.status,
      netAreaSqft: units.netAreaSqft,
      grossAreaSqft: units.grossAreaSqft,
      ratePerSqftPkr: units.ratePerSqftPkr,
      priceAdjustmentPkr: units.priceAdjustmentPkr,
      totalPricePkr: sql<string>`case when ${units.status} = 'SOLD' then coalesce(${units.soldPricePkr}, round((${units.ratePerSqftPkr} * ${units.netAreaSqft}) + coalesce(${units.priceAdjustmentPkr}, 0), 0)) else round((${units.ratePerSqftPkr} * ${units.netAreaSqft}) + coalesce(${units.priceAdjustmentPkr}, 0), 0) end::text`,
      isSellable: units.isSellable,
      ownershipGroup: units.ownershipGroup,
      bookingRef: units.bookingRef,
    })
    .from(units)
    .innerJoin(floors, and(eq(units.floorId, floors.id), isNull(floors.archivedAt)))
    .innerJoin(blocks, and(eq(floors.blockId, blocks.id), isNull(blocks.archivedAt)))
    .innerJoin(categories, eq(units.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(asc(blocks.name), desc(floors.level), asc(units.unitCode));

  return rows;
}

export async function getExportSoldUnitsData(filter?: {
  propertyId?: string;
  blockId?: string;
}): Promise<SoldUnitsExportRow[]> {
  const conditions = [eq(units.status, "SOLD"), isNull(units.archivedAt)];
  if (filter?.propertyId) {
    conditions.push(eq(units.propertyId, filter.propertyId));
  }
  if (filter?.blockId) {
    conditions.push(eq(floors.blockId, filter.blockId));
  }

  const rows = await db
    .select({
      unitCode: units.unitCode,
      floorName: floors.name,
      level: floors.level,
      blockName: blocks.name,
      categoryName: categories.name,
      netAreaSqft: units.netAreaSqft,
      ratePerSqftPkr: units.ratePerSqftPkr,
      soldPricePkr: sql<string>`coalesce(${units.soldPricePkr}, round((${units.ratePerSqftPkr} * ${units.netAreaSqft}) + coalesce(${units.priceAdjustmentPkr}, 0), 0))::text`,
      soldAt: units.soldAt,
      soldByName: user.name,
      bookingRef: units.bookingRef,
      ownershipGroup: units.ownershipGroup,
    })
    .from(units)
    .innerJoin(floors, and(eq(units.floorId, floors.id), isNull(floors.archivedAt)))
    .innerJoin(blocks, and(eq(floors.blockId, blocks.id), isNull(blocks.archivedAt)))
    .innerJoin(categories, eq(units.categoryId, categories.id))
    .leftJoin(user, eq(units.soldBy, user.id))
    .where(and(...conditions))
    .orderBy(desc(units.soldAt), asc(units.unitCode));

  return rows;
}

export async function getExportFloorSummaryData(filter?: {
  propertyId?: string;
  blockId?: string;
}): Promise<FloorSummaryExportRow[]> {
  const floorsData = await getFloorsLedger(filter);
  return floorsData.map((f) => ({
    floorName: f.floorName,
    level: f.level,
    blockName: f.blockName,
    total: f.total,
    available: f.available,
    sold: f.sold,
    soldPercent: f.soldPercent,
    availableValuePkr: f.availableValuePkr,
    soldValuePkr: f.soldValuePkr,
    totalValuePkr: f.totalValuePkr,
  }));
}
