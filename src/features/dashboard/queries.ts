import "server-only";

import { cache } from "react";
import { and, asc, desc, eq, gte, inArray, isNull, sql } from "drizzle-orm";
import { db, withTransientDbRetry } from "@/db";
import { auditLog } from "@/db/schema/audit";
import { user } from "@/db/schema/auth";
import { blocks, categories, floors, properties } from "@/db/schema/property";
import {
  bookings,
  buybacks,
  clients,
  installments,
  payments,
  refunds,
  reservations,
  sales,
} from "@/db/schema/sales";
import { units, unitStatusHistory } from "@/db/schema/units";
import { getMonthlyRefundsAndBuybacks } from "@/features/sales/queries";
import { logger } from "@/lib/logger";
import { formatDecimal, parseDecimal } from "@/lib/money";

export interface DashboardStats {
  total: number;
  available: number;
  reserved: number;
  booked: number;
  sold: number;
  soldPercent: number;
  availableValuePkr: string;
  reservedValuePkr: string;
  bookedValuePkr: string;
  soldValuePkr: string;
  monthReversalsPkr: string;
  netCollectedPkr: string;
}

export interface FloorLedgerRow {
  floorId: string;
  floorName: string;
  floorLabel?: string;
  level: number;
  blockId: string;
  blockName: string;
  total: number;
  available: number;
  reserved: number;
  booked: number;
  sold: number;
  soldPercent: number;
  availableValuePkr: string;
  reservedValuePkr: string;
  bookedValuePkr: string;
  soldValuePkr: string;
  totalValuePkr: string;
}

export interface BlockBreakdownRow {
  blockId: string;
  blockName: string;
  total: number;
  available: number;
  reserved: number;
  booked: number;
  sold: number;
  soldPercent: number;
  availableValuePkr: string;
  reservedValuePkr: string;
  bookedValuePkr: string;
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
      reserved: sql<number>`count(${units.id}) filter (where ${units.status} = 'RESERVED')`,
      booked: sql<number>`count(${units.id}) filter (where ${units.status} = 'BOOKED')`,
      sold: sql<number>`count(${units.id}) filter (where ${units.status} = 'SOLD')`,
      availableValuePkr: sql<string>`coalesce(sum(case when ${units.status} = 'AVAILABLE' then round((${units.ratePerSqftPkr} * coalesce(${units.grossAreaSqft}, ${units.netAreaSqft})) + coalesce(${units.priceAdjustmentPkr}, 0), 0) else 0 end), 0)::text`,
      reservedValuePkr: sql<string>`coalesce(sum(case when ${units.status} = 'RESERVED' then round((${units.ratePerSqftPkr} * coalesce(${units.grossAreaSqft}, ${units.netAreaSqft})) + coalesce(${units.priceAdjustmentPkr}, 0), 0) else 0 end), 0)::text`,
      bookedValuePkr: sql<string>`coalesce(sum(case when ${units.status} = 'BOOKED' then round((${units.ratePerSqftPkr} * coalesce(${units.grossAreaSqft}, ${units.netAreaSqft})) + coalesce(${units.priceAdjustmentPkr}, 0), 0) else 0 end), 0)::text`,
      soldValuePkr: sql<string>`coalesce(sum(case when ${units.status} = 'SOLD' then coalesce(${units.soldPricePkr}, round((${units.ratePerSqftPkr} * coalesce(${units.grossAreaSqft}, ${units.netAreaSqft})) + coalesce(${units.priceAdjustmentPkr}, 0), 0)) else 0 end), 0)::text`,
    })
    .from(units)
    .innerJoin(floors, and(eq(units.floorId, floors.id), isNull(floors.archivedAt)))
    .innerJoin(blocks, and(eq(floors.blockId, blocks.id), isNull(blocks.archivedAt)))
    .where(and(...conditions));

  const [revData, [paymentsSum], [salesSum], [refundsSum], [buybacksSum]] =
    await Promise.all([
      getMonthlyRefundsAndBuybacks(),
      db
        .select({ total: sql<string>`coalesce(sum(${payments.amount}), 0)::text` })
        .from(payments)
        .where(eq(payments.isVoided, false)),
      db
        .select({ total: sql<string>`coalesce(sum(${sales.salePrice}), 0)::text` })
        .from(sales),
      db
        .select({ total: sql<string>`coalesce(sum(${refunds.refundAmount}), 0)::text` })
        .from(refunds),
      db
        .select({ total: sql<string>`coalesce(sum(${buybacks.buybackAmount}), 0)::text` })
        .from(buybacks),
    ]);

  const grossCollectedPaisa =
    parseDecimal(paymentsSum?.total ?? "0") + parseDecimal(salesSum?.total ?? "0");
  const totalReversalsPaisa =
    parseDecimal(refundsSum?.total ?? "0") + parseDecimal(buybacksSum?.total ?? "0");
  const netCollectedPaisa =
    grossCollectedPaisa > totalReversalsPaisa
      ? grossCollectedPaisa - totalReversalsPaisa
      : 0n;

  const total = Number(row?.total ?? 0);
  const available = Number(row?.available ?? 0);
  const reserved = Number(row?.reserved ?? 0);
  const booked = Number(row?.booked ?? 0);
  const sold = Number(row?.sold ?? 0);
  const soldPercent = total > 0 ? (sold / total) * 100 : 0;

  return {
    total,
    available,
    reserved,
    booked,
    sold,
    soldPercent,
    availableValuePkr: row?.availableValuePkr ?? "0",
    reservedValuePkr: row?.reservedValuePkr ?? "0",
    bookedValuePkr: row?.bookedValuePkr ?? "0",
    soldValuePkr: row?.soldValuePkr ?? "0",
    monthReversalsPkr: revData.totalMonthReversalsPkr,
    netCollectedPkr: formatDecimal(netCollectedPaisa),
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
      reserved: sql<number>`count(${units.id}) filter (where ${units.status} = 'RESERVED')`,
      booked: sql<number>`count(${units.id}) filter (where ${units.status} = 'BOOKED')`,
      sold: sql<number>`count(${units.id}) filter (where ${units.status} = 'SOLD')`,
      availableValuePkr: sql<string>`coalesce(sum(case when ${units.status} = 'AVAILABLE' then round((${units.ratePerSqftPkr} * coalesce(${units.grossAreaSqft}, ${units.netAreaSqft})) + coalesce(${units.priceAdjustmentPkr}, 0), 0) else 0 end), 0)::text`,
      reservedValuePkr: sql<string>`coalesce(sum(case when ${units.status} = 'RESERVED' then round((${units.ratePerSqftPkr} * coalesce(${units.grossAreaSqft}, ${units.netAreaSqft})) + coalesce(${units.priceAdjustmentPkr}, 0), 0) else 0 end), 0)::text`,
      bookedValuePkr: sql<string>`coalesce(sum(case when ${units.status} = 'BOOKED' then round((${units.ratePerSqftPkr} * coalesce(${units.grossAreaSqft}, ${units.netAreaSqft})) + coalesce(${units.priceAdjustmentPkr}, 0), 0) else 0 end), 0)::text`,
      soldValuePkr: sql<string>`coalesce(sum(case when ${units.status} = 'SOLD' then coalesce(${units.soldPricePkr}, round((${units.ratePerSqftPkr} * coalesce(${units.grossAreaSqft}, ${units.netAreaSqft})) + coalesce(${units.priceAdjustmentPkr}, 0), 0)) else 0 end), 0)::text`,
      totalValuePkr: sql<string>`coalesce(sum(case when ${units.status} = 'SOLD' then coalesce(${units.soldPricePkr}, round((${units.ratePerSqftPkr} * coalesce(${units.grossAreaSqft}, ${units.netAreaSqft})) + coalesce(${units.priceAdjustmentPkr}, 0), 0)) else round((${units.ratePerSqftPkr} * coalesce(${units.grossAreaSqft}, ${units.netAreaSqft})) + coalesce(${units.priceAdjustmentPkr}, 0), 0) end), 0)::text`,
    })
    .from(floors)
    .innerJoin(blocks, eq(floors.blockId, blocks.id))
    .leftJoin(units, sql`${units.floorId} = ${floors.id} and ${units.archivedAt} is null`)
    .where(and(...floorConditions))
    .groupBy(floors.id, floors.name, floors.level, blocks.id, blocks.name)
    .orderBy(desc(floors.level), asc(floors.name));

  const distinctBlocks = new Set(rows.map((r) => r.blockId));
  const hasMultipleBlocks = distinctBlocks.size > 1;

  return rows.map((r) => {
    const total = Number(r.total);
    const sold = Number(r.sold);
    const floorLabel = hasMultipleBlocks
      ? `${r.floorName} · ${r.blockName}`
      : r.floorName;
    return {
      floorId: r.floorId,
      floorName: r.floorName,
      floorLabel,
      level: r.level,
      blockId: r.blockId,
      blockName: r.blockName,
      total,
      available: Number(r.available),
      reserved: Number(r.reserved),
      booked: Number(r.booked),
      sold,
      soldPercent: total > 0 ? (sold / total) * 100 : 0,
      availableValuePkr: r.availableValuePkr,
      reservedValuePkr: r.reservedValuePkr,
      bookedValuePkr: r.bookedValuePkr,
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
      reserved: sql<number>`count(${units.id}) filter (where ${units.status} = 'RESERVED')`,
      booked: sql<number>`count(${units.id}) filter (where ${units.status} = 'BOOKED')`,
      sold: sql<number>`count(${units.id}) filter (where ${units.status} = 'SOLD')`,
      availableValuePkr: sql<string>`coalesce(sum(case when ${units.status} = 'AVAILABLE' then round((${units.ratePerSqftPkr} * coalesce(${units.grossAreaSqft}, ${units.netAreaSqft})) + coalesce(${units.priceAdjustmentPkr}, 0), 0) else 0 end), 0)::text`,
      reservedValuePkr: sql<string>`coalesce(sum(case when ${units.status} = 'RESERVED' then round((${units.ratePerSqftPkr} * coalesce(${units.grossAreaSqft}, ${units.netAreaSqft})) + coalesce(${units.priceAdjustmentPkr}, 0), 0) else 0 end), 0)::text`,
      bookedValuePkr: sql<string>`coalesce(sum(case when ${units.status} = 'BOOKED' then round((${units.ratePerSqftPkr} * coalesce(${units.grossAreaSqft}, ${units.netAreaSqft})) + coalesce(${units.priceAdjustmentPkr}, 0), 0) else 0 end), 0)::text`,
      soldValuePkr: sql<string>`coalesce(sum(case when ${units.status} = 'SOLD' then coalesce(${units.soldPricePkr}, round((${units.ratePerSqftPkr} * coalesce(${units.grossAreaSqft}, ${units.netAreaSqft})) + coalesce(${units.priceAdjustmentPkr}, 0), 0)) else 0 end), 0)::text`,
      totalValuePkr: sql<string>`coalesce(sum(case when ${units.status} = 'SOLD' then coalesce(${units.soldPricePkr}, round((${units.ratePerSqftPkr} * coalesce(${units.grossAreaSqft}, ${units.netAreaSqft})) + coalesce(${units.priceAdjustmentPkr}, 0), 0)) else round((${units.ratePerSqftPkr} * coalesce(${units.grossAreaSqft}, ${units.netAreaSqft})) + coalesce(${units.priceAdjustmentPkr}, 0), 0) end), 0)::text`,
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
      reserved: Number(r.reserved),
      booked: Number(r.booked),
      sold,
      soldPercent: total > 0 ? (sold / total) * 100 : 0,
      availableValuePkr: r.availableValuePkr,
      reservedValuePkr: r.reservedValuePkr,
      bookedValuePkr: r.bookedValuePkr,
      soldValuePkr: r.soldValuePkr,
      totalValuePkr: r.totalValuePkr,
    };
  });
}

function getLast12Months(): { month: string; label: string }[] {
  const result: { month: string; label: string }[] = [];
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
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const ym = `${year}-${month}`;
    const label = `${monthNames[d.getUTCMonth()]} ${year}`;
    result.push({ month: ym, label });
  }
  return result;
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
      volumePkr: sql<string>`coalesce(sum(coalesce(${unitStatusHistory.soldPricePkr}, round((${units.ratePerSqftPkr} * coalesce(${units.grossAreaSqft}, ${units.netAreaSqft})) + coalesce(${units.priceAdjustmentPkr}, 0), 0))), 0)::text`,
    })
    .from(unitStatusHistory)
    .innerJoin(units, eq(unitStatusHistory.unitId, units.id))
    .innerJoin(floors, eq(units.floorId, floors.id))
    .innerJoin(blocks, eq(floors.blockId, blocks.id))
    .where(and(...salesConditions))
    .groupBy(sql`date_trunc('month', ${unitStatusHistory.createdAt})`)
    .orderBy(sql`date_trunc('month', ${unitStatusHistory.createdAt}) asc`);

  const last12 = getLast12Months();
  const rowMap = new Map(rows.map((r) => [r.month, r]));

  return last12.map(({ month, label }) => {
    const r = rowMap.get(month);
    return {
      month,
      label,
      count: r ? Number(r.count) : 0,
      volumePkr: r?.volumePkr ?? "0",
    };
  });
}

export async function getCollectionsOverTime(): Promise<SalesOverTimePoint[]> {
  const rows = await db
    .select({
      month: sql<string>`to_char(date_trunc('month', ${payments.paidAt}), 'YYYY-MM')`,
      count: sql<number>`count(${payments.id})::int`,
      volumePkr: sql<string>`coalesce(sum(${payments.amount}), 0)::text`,
    })
    .from(payments)
    .where(
      and(
        eq(payments.isVoided, false),
        gte(payments.paidAt, sql`now() - interval '12 months'`),
      ),
    )
    .groupBy(sql`date_trunc('month', ${payments.paidAt})`)
    .orderBy(sql`date_trunc('month', ${payments.paidAt}) asc`);

  const last12 = getLast12Months();
  const rowMap = new Map(rows.map((r) => [r.month, r]));

  return last12.map(({ month, label }) => {
    const r = rowMap.get(month);
    return {
      month,
      label,
      count: r ? Number(r.count) : 0,
      volumePkr: r?.volumePkr ?? "0",
    };
  });
}

export interface RecentBookingItem {
  id: string;
  bookingNo: string;
  clientName: string;
  unitCode: string;
  netPrice: string;
  paidTotal: string;
  paidPercent: number;
  createdAt: Date;
}

export interface DashboardInstallmentItem {
  id: string;
  bookingId: string;
  bookingNo: string;
  seq: number;
  dueDate: Date;
  amount: string;
  paidAmount: string;
  balancePkr: string;
  unitCode: string;
  clientName: string;
  daysLate: number;
}

export interface DashboardNeedsAttention {
  overdueCount: number;
  overduePkr: string;
  dueThisWeekCount: number;
  dueThisWeekPkr: string;
  expiringReservationsCount: number;
}

export interface DashboardBundle {
  stats: DashboardStats;
  attention: DashboardNeedsAttention;
  floors: FloorLedgerRow[];
  blocks: BlockBreakdownRow[];
  salesOverTime: SalesOverTimePoint[];
  collectionsByMonth: SalesOverTimePoint[];
  receivablePkr: string;
  activeBookingsCount: number;
  monthCollectedPkr: string;
  lastMonthCollectedPkr: string;
  recentBookings: RecentBookingItem[];
  overdueInstallments: DashboardInstallmentItem[];
  dueNext7DaysInstallments: DashboardInstallmentItem[];
}

const dashboardBundleCache = new Map<
  string,
  {
    expiresAt: number;
    data: DashboardBundle;
  }
>();
const DASHBOARD_BUNDLE_CACHE_TTL_MS = 300_000; // 5 minutes

let cachedNavCounts: {
  expiresAt: number;
  data: NavCounts;
} | null = null;
const NAV_COUNTS_CACHE_TTL_MS = 30_000; // 30 seconds

export function invalidateNavCountsCache() {
  cachedNavCounts = null;
}

export function invalidateDashboardBundleCache() {
  dashboardBundleCache.clear();
  invalidateNavCountsCache();
}

export async function getDashboardBundle(filter?: {
  propertyId?: string;
  blockId?: string;
}): Promise<DashboardBundle> {
  const cacheKey = JSON.stringify({
    propertyId: filter?.propertyId ?? "",
    blockId: filter?.blockId ?? "",
  });
  const cached = dashboardBundleCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  return withTransientDbRetry(async () => {
    const t0 = performance.now();

    const now = new Date();
    const startOfMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    ).toISOString();

    const [
      floorsData,
      salesOverTime,
      collectionsByMonth,
      recentBookingRows,
      overdueInstallmentRows,
      dueNext7DaysRows,
      sumsRows,
    ] = await Promise.all([
      getFloorsLedger(filter),
      getSalesOverTime(filter),
      getCollectionsOverTime(),
      db
        .select({
          id: bookings.id,
          bookingNo: bookings.bookingNo,
          clientName: clients.fullName,
          unitCode: units.unitCode,
          netPrice: bookings.netPrice,
          paidTotal: bookings.paidTotal,
          createdAt: bookings.createdAt,
        })
        .from(bookings)
        .innerJoin(units, eq(bookings.unitId, units.id))
        .innerJoin(clients, eq(bookings.clientId, clients.id))
        .where(eq(bookings.status, "ACTIVE"))
        .orderBy(desc(bookings.createdAt))
        .limit(5),
      db
        .select({
          id: installments.id,
          bookingId: bookings.id,
          bookingNo: bookings.bookingNo,
          seq: installments.seq,
          dueDate: installments.dueDate,
          amount: installments.amount,
          paidAmount: installments.paidAmount,
          unitCode: units.unitCode,
          clientName: clients.fullName,
        })
        .from(installments)
        .innerJoin(bookings, eq(installments.bookingId, bookings.id))
        .innerJoin(units, eq(bookings.unitId, units.id))
        .innerJoin(clients, eq(bookings.clientId, clients.id))
        .where(
          and(
            eq(bookings.status, "ACTIVE"),
            sql`${installments.paidAmount} < ${installments.amount}`,
            sql`${installments.dueDate} < now()`,
          ),
        )
        .orderBy(asc(installments.dueDate), asc(installments.seq))
        .limit(5),
      db
        .select({
          id: installments.id,
          bookingId: bookings.id,
          bookingNo: bookings.bookingNo,
          seq: installments.seq,
          dueDate: installments.dueDate,
          amount: installments.amount,
          paidAmount: installments.paidAmount,
          unitCode: units.unitCode,
          clientName: clients.fullName,
        })
        .from(installments)
        .innerJoin(bookings, eq(installments.bookingId, bookings.id))
        .innerJoin(units, eq(bookings.unitId, units.id))
        .innerJoin(clients, eq(bookings.clientId, clients.id))
        .where(
          and(
            eq(bookings.status, "ACTIVE"),
            sql`${installments.paidAmount} < ${installments.amount}`,
            sql`${installments.dueDate} >= now()`,
            sql`${installments.dueDate} <= now() + interval '7 days'`,
          ),
        )
        .orderBy(asc(installments.dueDate), asc(installments.seq))
        .limit(5),
      db.execute(sql`
        with p as (
          select
            coalesce(sum(${payments.amount}), 0)::text as payments_total,
            coalesce(sum(${payments.amount}) filter (where ${payments.isVoided} = false and ${payments.paidAt} >= ${startOfMonth}::timestamptz), 0)::text as month_collected_pkr,
            coalesce(sum(${payments.amount}) filter (where ${payments.isVoided} = false and ${payments.paidAt} >= date_trunc('month', ${startOfMonth}::timestamptz - interval '1 month') and ${payments.paidAt} < ${startOfMonth}::timestamptz), 0)::text as last_month_collected_pkr
          from ${payments}
        ),
        s as (
          select coalesce(sum(${sales.salePrice}), 0)::text as sales_total from ${sales}
        ),
        r as (
          select
            coalesce(sum(${refunds.refundAmount}), 0)::text as refunds_total,
            coalesce(sum(${refunds.refundAmount}) filter (where ${refunds.paidAt} >= ${startOfMonth}::timestamptz), 0)::text as refunds_month
          from ${refunds}
        ),
        bb as (
          select
            coalesce(sum(${buybacks.buybackAmount}), 0)::text as buybacks_total,
            coalesce(sum(${buybacks.buybackAmount}) filter (where ${buybacks.paidAt} >= ${startOfMonth}::timestamptz), 0)::text as buybacks_month
          from ${buybacks}
        ),
        inst as (
          select
            count(*) filter (where ${installments.paidAmount} < ${installments.amount} and ${installments.dueDate} < now())::int as overdue_count,
            coalesce(sum(${installments.amount} - ${installments.paidAmount}) filter (where ${installments.paidAmount} < ${installments.amount} and ${installments.dueDate} < now()), 0)::text as overdue_pkr,
            count(*) filter (where ${installments.paidAmount} < ${installments.amount} and ${installments.dueDate} >= now() and ${installments.dueDate} <= now() + interval '7 days')::int as due_this_week_count,
            coalesce(sum(${installments.amount} - ${installments.paidAmount}) filter (where ${installments.paidAmount} < ${installments.amount} and ${installments.dueDate} >= now() and ${installments.dueDate} <= now() + interval '7 days'), 0)::text as due_this_week_pkr
          from ${installments}
          inner join ${bookings} on ${installments.bookingId} = ${bookings.id}
          where ${bookings.status} = 'ACTIVE'
        ),
        res as (
          select
            count(*)::int as expiring_reservations_count
          from ${reservations}
          where ${reservations.status} = 'ACTIVE'
            and ${reservations.expiresAt} > now()
            and ${reservations.expiresAt} <= now() + interval '48 hours'
        ),
        b as (
          select
            coalesce(sum(${bookings.netPrice} - ${bookings.paidTotal}), 0)::text as receivable_pkr,
            count(*)::int as active_bookings_count
          from ${bookings}
          where ${bookings.status} = 'ACTIVE'
        )
        select
          p.payments_total,
          s.sales_total,
          r.refunds_total,
          r.refunds_month,
          bb.buybacks_total,
          bb.buybacks_month,
          inst.overdue_count,
          inst.overdue_pkr,
          inst.due_this_week_count,
          inst.due_this_week_pkr,
          res.expiring_reservations_count,
          b.receivable_pkr,
          b.active_bookings_count,
          p.month_collected_pkr,
          p.last_month_collected_pkr
        from p, s, r, bb, inst, res, b
      `),
    ]);

    const sumsRow = ((sumsRows as unknown as Record<string, unknown>[])[0] ??
      {}) as Record<string, unknown>;
    const sums = {
      payments_total: String(sumsRow.payments_total ?? "0"),
      sales_total: String(sumsRow.sales_total ?? "0"),
      refunds_total: String(sumsRow.refunds_total ?? "0"),
      buybacks_total: String(sumsRow.buybacks_total ?? "0"),
      refunds_month: String(sumsRow.refunds_month ?? "0"),
      buybacks_month: String(sumsRow.buybacks_month ?? "0"),
      overdue_count: Number(sumsRow.overdue_count ?? 0),
      overdue_pkr: String(sumsRow.overdue_pkr ?? "0"),
      due_this_week_count: Number(sumsRow.due_this_week_count ?? 0),
      due_this_week_pkr: String(sumsRow.due_this_week_pkr ?? "0"),
      expiring_reservations_count: Number(sumsRow.expiring_reservations_count ?? 0),
      receivable_pkr: String(sumsRow.receivable_pkr ?? "0"),
      active_bookings_count: Number(sumsRow.active_bookings_count ?? 0),
      month_collected_pkr: String(sumsRow.month_collected_pkr ?? "0"),
      last_month_collected_pkr: String(sumsRow.last_month_collected_pkr ?? "0"),
    };

    let totalUnits = 0;
    let availableUnits = 0;
    let reservedUnits = 0;
    let bookedUnits = 0;
    let soldUnits = 0;
    let availableValueTotal = 0n;
    let reservedValueTotal = 0n;
    let bookedValueTotal = 0n;
    let soldValueTotal = 0n;

    const blockMap = new Map<
      string,
      {
        blockId: string;
        blockName: string;
        total: number;
        available: number;
        reserved: number;
        booked: number;
        sold: number;
        availableValuePkr: bigint;
        reservedValuePkr: bigint;
        bookedValuePkr: bigint;
        soldValuePkr: bigint;
        totalValuePkr: bigint;
      }
    >();

    for (const f of floorsData) {
      totalUnits += f.total;
      availableUnits += f.available;
      reservedUnits += f.reserved;
      bookedUnits += f.booked;
      soldUnits += f.sold;
      const availVal = BigInt(Math.round(Number(f.availableValuePkr) || 0));
      const resVal = BigInt(Math.round(Number(f.reservedValuePkr) || 0));
      const bkVal = BigInt(Math.round(Number(f.bookedValuePkr) || 0));
      const soldVal = BigInt(Math.round(Number(f.soldValuePkr) || 0));
      const totalVal = BigInt(Math.round(Number(f.totalValuePkr) || 0));
      availableValueTotal += availVal;
      reservedValueTotal += resVal;
      bookedValueTotal += bkVal;
      soldValueTotal += soldVal;

      const existingBlock = blockMap.get(f.blockId);
      if (existingBlock) {
        existingBlock.total += f.total;
        existingBlock.available += f.available;
        existingBlock.reserved += f.reserved;
        existingBlock.booked += f.booked;
        existingBlock.sold += f.sold;
        existingBlock.availableValuePkr += availVal;
        existingBlock.reservedValuePkr += resVal;
        existingBlock.bookedValuePkr += bkVal;
        existingBlock.soldValuePkr += soldVal;
        existingBlock.totalValuePkr += totalVal;
      } else {
        blockMap.set(f.blockId, {
          blockId: f.blockId,
          blockName: f.blockName,
          total: f.total,
          available: f.available,
          reserved: f.reserved,
          booked: f.booked,
          sold: f.sold,
          availableValuePkr: availVal,
          reservedValuePkr: resVal,
          bookedValuePkr: bkVal,
          soldValuePkr: soldVal,
          totalValuePkr: totalVal,
        });
      }
    }

    const grossCollectedPaisa =
      parseDecimal(sums?.payments_total ?? "0") + parseDecimal(sums?.sales_total ?? "0");
    const totalReversalsPaisa =
      parseDecimal(sums?.refunds_total ?? "0") +
      parseDecimal(sums?.buybacks_total ?? "0");
    const monthReversalsPaisa =
      parseDecimal(sums?.refunds_month ?? "0") +
      parseDecimal(sums?.buybacks_month ?? "0");
    const netCollectedPaisa =
      grossCollectedPaisa > totalReversalsPaisa
        ? grossCollectedPaisa - totalReversalsPaisa
        : 0n;

    const soldPercent = totalUnits > 0 ? (soldUnits / totalUnits) * 100 : 0;
    const stats: DashboardStats = {
      total: totalUnits,
      available: availableUnits,
      reserved: reservedUnits,
      booked: bookedUnits,
      sold: soldUnits,
      soldPercent,
      availableValuePkr: availableValueTotal.toString(),
      reservedValuePkr: reservedValueTotal.toString(),
      bookedValuePkr: bookedValueTotal.toString(),
      soldValuePkr: soldValueTotal.toString(),
      monthReversalsPkr: formatDecimal(monthReversalsPaisa),
      netCollectedPkr: formatDecimal(netCollectedPaisa),
    };

    const blocksData: BlockBreakdownRow[] = Array.from(blockMap.values()).map((b) => ({
      blockId: b.blockId,
      blockName: b.blockName,
      total: b.total,
      available: b.available,
      reserved: b.reserved,
      booked: b.booked,
      sold: b.sold,
      soldPercent: b.total > 0 ? (b.sold / b.total) * 100 : 0,
      availableValuePkr: b.availableValuePkr.toString(),
      reservedValuePkr: b.reservedValuePkr.toString(),
      bookedValuePkr: b.bookedValuePkr.toString(),
      soldValuePkr: b.soldValuePkr.toString(),
      totalValuePkr: b.totalValuePkr.toString(),
    }));

    const attention: DashboardNeedsAttention = {
      overdueCount: Number(sums?.overdue_count ?? 0),
      overduePkr: sums?.overdue_pkr ?? "0",
      dueThisWeekCount: Number(sums?.due_this_week_count ?? 0),
      dueThisWeekPkr: sums?.due_this_week_pkr ?? "0",
      expiringReservationsCount: Number(sums?.expiring_reservations_count ?? 0),
    };

    const recentBookings: RecentBookingItem[] = recentBookingRows.map((r) => {
      const netPaisa = parseDecimal(r.netPrice);
      const paidPaisa = parseDecimal(r.paidTotal);
      const percent = netPaisa > 0n ? Number((paidPaisa * 100n) / netPaisa) : 0;
      return {
        id: r.id,
        bookingNo: r.bookingNo,
        clientName: r.clientName,
        unitCode: r.unitCode,
        netPrice: r.netPrice,
        paidTotal: r.paidTotal,
        paidPercent: Math.round(percent),
        createdAt: r.createdAt,
      };
    });

    const formatInst = (
      r: (typeof overdueInstallmentRows)[number],
    ): DashboardInstallmentItem => {
      const amtPaisa = parseDecimal(r.amount);
      const paidPaisa = parseDecimal(r.paidAmount);
      const balPaisa = amtPaisa - paidPaisa;
      const daysLate = Math.max(
        0,
        Math.floor(
          (now.getTime() - new Date(r.dueDate).getTime()) / (1000 * 60 * 60 * 24),
        ),
      );
      return {
        id: r.id,
        bookingId: r.bookingId,
        bookingNo: r.bookingNo,
        seq: r.seq,
        dueDate: r.dueDate,
        amount: r.amount,
        paidAmount: r.paidAmount,
        balancePkr: formatDecimal(balPaisa),
        unitCode: r.unitCode,
        clientName: r.clientName,
        daysLate,
      };
    };

    const overdueInstallments = overdueInstallmentRows.map(formatInst);
    const dueNext7DaysInstallments = dueNext7DaysRows.map(formatInst);

    const durationMs = Math.round(performance.now() - t0);
    logger.info({ durationMs, filter }, "server timing: dashboard bundle");

    const bundle: DashboardBundle = {
      stats,
      attention,
      floors: floorsData,
      blocks: blocksData,
      salesOverTime,
      collectionsByMonth,
      receivablePkr: sums.receivable_pkr,
      activeBookingsCount: sums.active_bookings_count,
      monthCollectedPkr: sums.month_collected_pkr,
      lastMonthCollectedPkr: sums.last_month_collected_pkr,
      recentBookings,
      overdueInstallments,
      dueNext7DaysInstallments,
    };

    dashboardBundleCache.set(cacheKey, {
      expiresAt: Date.now() + DASHBOARD_BUNDLE_CACHE_TTL_MS,
      data: bundle,
    });

    return bundle;
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
    })
    .from(auditLog)
    .leftJoin(user, eq(auditLog.actorId, user.id))
    .orderBy(desc(auditLog.createdAt))
    .limit(limit);

  if (rows.length === 0) return [];

  const unitIds: string[] = [];
  const blockIds: string[] = [];
  const floorIds: string[] = [];
  const propertyIds: string[] = [];

  for (const r of rows) {
    const after = r.after as Record<string, unknown> | null;
    const before = r.before as Record<string, unknown> | null;
    if (r.entity === "unit" && !after?.unitCode && !before?.unitCode) {
      unitIds.push(r.entityId);
    } else if (r.entity === "block" && !after?.name && !before?.name) {
      blockIds.push(r.entityId);
    } else if (r.entity === "floor" && !after?.name && !before?.name) {
      floorIds.push(r.entityId);
    } else if (r.entity === "property" && !after?.name && !before?.name) {
      propertyIds.push(r.entityId);
    }
  }

  const [unitRows, blockRows, floorRows, propRows] = await Promise.all([
    unitIds.length > 0
      ? db
          .select({ id: units.id, name: units.unitCode })
          .from(units)
          .where(inArray(units.id, unitIds))
      : Promise.resolve([]),
    blockIds.length > 0
      ? db
          .select({ id: blocks.id, name: blocks.name })
          .from(blocks)
          .where(inArray(blocks.id, blockIds))
      : Promise.resolve([]),
    floorIds.length > 0
      ? db
          .select({ id: floors.id, name: floors.name })
          .from(floors)
          .where(inArray(floors.id, floorIds))
      : Promise.resolve([]),
    propertyIds.length > 0
      ? db
          .select({ id: properties.id, name: properties.name })
          .from(properties)
          .where(inArray(properties.id, propertyIds))
      : Promise.resolve([]),
  ]);

  const unitMap = new Map(unitRows.map((u) => [u.id, u.name]));
  const blockMap = new Map(blockRows.map((b) => [b.id, b.name]));
  const floorMap = new Map(floorRows.map((f) => [f.id, f.name]));
  const propMap = new Map(propRows.map((p) => [p.id, p.name]));

  return rows.map((r) => {
    let targetName = "";
    const after = r.after as Record<string, unknown> | null;
    const before = r.before as Record<string, unknown> | null;

    if (r.entity === "unit") {
      targetName =
        (typeof after?.unitCode === "string" ? after.unitCode : undefined) ??
        (typeof before?.unitCode === "string" ? before.unitCode : undefined) ??
        unitMap.get(r.entityId) ??
        "Unit";
    } else if (r.entity === "block") {
      targetName =
        (typeof after?.name === "string" ? after.name : undefined) ??
        (typeof before?.name === "string" ? before.name : undefined) ??
        blockMap.get(r.entityId) ??
        "Block";
    } else if (r.entity === "floor") {
      targetName =
        (typeof after?.name === "string" ? after.name : undefined) ??
        (typeof before?.name === "string" ? before.name : undefined) ??
        floorMap.get(r.entityId) ??
        "Floor";
    } else if (r.entity === "property") {
      targetName =
        (typeof after?.name === "string" ? after.name : undefined) ??
        (typeof before?.name === "string" ? before.name : undefined) ??
        propMap.get(r.entityId) ??
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

let cachedDashboardFilterOptions: {
  expiresAt: number;
  data: DashboardFilterOptions;
} | null = null;
const DASHBOARD_FILTER_OPTIONS_CACHE_TTL_MS = 5 * 60_000; // 5 minutes

export function invalidateDashboardFilterOptionsCache() {
  cachedDashboardFilterOptions = null;
}

export async function getDashboardFilterOptions(): Promise<DashboardFilterOptions> {
  if (
    cachedDashboardFilterOptions &&
    cachedDashboardFilterOptions.expiresAt > Date.now()
  ) {
    return cachedDashboardFilterOptions.data;
  }

  const [props, blks] = await withTransientDbRetry(() =>
    Promise.all([
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
    ]),
  );

  const data: DashboardFilterOptions = { properties: props, blocks: blks };
  cachedDashboardFilterOptions = {
    expiresAt: Date.now() + DASHBOARD_FILTER_OPTIONS_CACHE_TTL_MS,
    data,
  };
  return data;
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
      totalPricePkr: sql<string>`case when ${units.status} = 'SOLD' then coalesce(${units.soldPricePkr}, round((${units.ratePerSqftPkr} * coalesce(${units.grossAreaSqft}, ${units.netAreaSqft})) + coalesce(${units.priceAdjustmentPkr}, 0), 0)) else round((${units.ratePerSqftPkr} * coalesce(${units.grossAreaSqft}, ${units.netAreaSqft})) + coalesce(${units.priceAdjustmentPkr}, 0), 0) end::text`,
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
      soldPricePkr: sql<string>`coalesce(${units.soldPricePkr}, round((${units.ratePerSqftPkr} * coalesce(${units.grossAreaSqft}, ${units.netAreaSqft})) + coalesce(${units.priceAdjustmentPkr}, 0), 0))::text`,
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

export interface NavCounts {
  unitsTotal: number;
  bookingsActive: number;
  reservationsActive: number;
  soldTotal: number;
  installmentsOverdue: number;
}

export const getNavCounts = cache(async function getNavCounts(): Promise<NavCounts> {
  if (cachedNavCounts && cachedNavCounts.expiresAt > Date.now()) {
    return cachedNavCounts.data;
  }
  return withTransientDbRetry(async () => {
    const res = await db.execute<{
      units_total: number;
      sold_total: number;
      active_bookings: number;
      active_reservations: number;
      overdue_installments: number;
    }>(sql`
      select
        count(*) filter (where ${units.archivedAt} is null)::int as units_total,
        count(*) filter (where ${units.archivedAt} is null and ${units.status} = 'SOLD')::int as sold_total,
        (select count(*)::int from ${bookings} where ${bookings.status} = 'ACTIVE') as active_bookings,
        (select count(*)::int from ${reservations} where ${reservations.status} = 'ACTIVE') as active_reservations,
        (select count(*)::int from ${installments} inner join ${bookings} on ${installments.bookingId} = ${bookings.id} where ${bookings.status} = 'ACTIVE' and ${installments.paidAmount} < ${installments.amount} and ${installments.dueDate} < now())::int as overdue_installments
      from ${units}
    `);

    const row = res[0];
    const data = {
      unitsTotal: Number(row?.units_total ?? 0),
      soldTotal: Number(row?.sold_total ?? 0),
      bookingsActive: Number(row?.active_bookings ?? 0),
      reservationsActive: Number(row?.active_reservations ?? 0),
      installmentsOverdue: Number(row?.overdue_installments ?? 0),
    };
    cachedNavCounts = {
      expiresAt: Date.now() + NAV_COUNTS_CACHE_TTL_MS,
      data,
    };
    return data;
  });
});
