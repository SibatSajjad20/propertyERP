import "server-only";

import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNull,
  lte,
  or,
  sql,
} from "drizzle-orm";
import { db } from "@/db";
import { blocks, categories, floors, properties } from "@/db/schema/property";
import type {
  BookingStatus,
  InstallmentStatus,
  ReservationStatus,
} from "@/db/schema/enums";
import {
  bookings,
  buybacks,
  clients,
  installments,
  nextOfKin,
  payments,
  refunds,
  reservations,
  sales,
} from "@/db/schema/sales";
import { units } from "@/db/schema/units";
import { calculateInstallmentSurcharge } from "@/features/installments/surcharge";
import { formatUnitDisplayCode } from "@/lib/area";
import { logger } from "@/lib/logger";
import { formatDecimal, parseDecimal } from "@/lib/money";
import {
  calculateClientLedger,
  type LedgerRawEntry,
} from "@/features/installments/calculator";
import { resolvePresetDates, type ReportFilters } from "./schema";

export interface FilterOptions {
  properties: Array<{ id: string; name: string }>;
  blocks: Array<{ id: string; name: string }>;
  floors: Array<{ id: string; name: string; level: number }>;
  categories: Array<{ id: string; name: string }>;
}

export async function getReportFilterOptions(): Promise<FilterOptions> {
  const [props, blks, flrs, cats] = await Promise.all([
    db.select({ id: properties.id, name: properties.name }).from(properties),
    db.select({ id: blocks.id, name: blocks.name }).from(blocks),
    db
      .select({ id: floors.id, name: floors.name, level: floors.level })
      .from(floors)
      .orderBy(asc(floors.level)),
    db
      .select({ id: categories.id, name: categories.name })
      .from(categories)
      .orderBy(asc(categories.name)),
  ]);

  return {
    properties: props,
    blocks: blks,
    floors: flrs,
    categories: cats,
  };
}

// -------------------------------------------------------------
// A) SUMMARY REPORT
// -------------------------------------------------------------

export interface SummaryReportData {
  period: {
    startDate: string;
    endDate: string;
  };
  unitsByStatus: {
    available: { count: number; valuePkr: string };
    reserved: { count: number; valuePkr: string };
    booked: { count: number; valuePkr: string };
    sold: { count: number; valuePkr: string };
    total: { count: number; valuePkr: string };
  };
  periodMetrics: {
    salesValuePkr: string;
    salesCount: number;
    collectedPkr: string; // Net of refunds & buybacks
    grossCollectedPkr: string;
    outstandingReceivablesPkr: string;
    overdueAmountPkr: string;
    overdueCount: number;
    discountsGivenPkr: string;
    discountsCount: number;
    refunds: { count: number; totalPkr: string };
    buybacks: { count: number; totalPkr: string };
  };
  monthlyCollections: Array<{
    month: string;
    label: string;
    collectedPkr: string;
    amount: number;
  }>;
  floorBreakdown: Array<{
    floorId: string;
    floorName: string;
    level: number;
    blockName: string;
    totalUnits: number;
    availableCount: number;
    bookedCount: number;
    soldCount: number;
    totalValuePkr: string;
    soldValuePkr: string;
  }>;
  categoryBreakdown: Array<{
    categoryId: string;
    categoryName: string;
    totalUnits: number;
    availableCount: number;
    bookedCount: number;
    soldCount: number;
    totalValuePkr: string;
    soldValuePkr: string;
  }>;
}

export async function getSummaryReport(
  filters: ReportFilters,
): Promise<SummaryReportData> {
  const t0 = performance.now();
  const floorId = filters.floorId ?? "";
  const categoryId = filters.categoryId ?? "";
  const { startDate, endDate } = resolvePresetDates(
    filters.preset,
    filters.startDate,
    filters.endDate,
  );
  const now = new Date();
  const startIso = startDate.toISOString();
  const endIso = endDate.toISOString();
  const nowIso = now.toISOString();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  // Unit conditions
  const unitConditions = [isNull(units.archivedAt)];
  if (floorId && floorId !== "ALL") {
    unitConditions.push(eq(units.floorId, floorId));
  }
  if (categoryId && categoryId !== "ALL") {
    unitConditions.push(eq(units.categoryId, categoryId));
  }

  const computedPriceSql = sql`round((${units.ratePerSqftPkr} * coalesce(${units.grossAreaSqft}, ${units.netAreaSqft})) + coalesce(${units.priceAdjustmentPkr}, 0), 0)::numeric(14, 2)`;

  const [statusStatsQuery, salesRows, paymentsRows, refundsRows, buybacksRows] =
    await Promise.all([
      db
        .select({
          status: units.status,
          count: sql<number>`count(*)::int`,
          totalValue: sql<string>`coalesce(sum(case when ${units.status} = 'SOLD' then coalesce(${units.soldPricePkr}, ${computedPriceSql}) else ${computedPriceSql} end), 0)::text`,
        })
        .from(units)
        .where(and(...unitConditions))
        .groupBy(units.status),
      db
        .select({
          sales_count: sql<number>`count(*) filter (where ${sales.status} = 'ACTIVE' and ${sales.soldAt} >= ${startIso}::timestamptz and ${sales.soldAt} <= ${endIso}::timestamptz)::int`,
          sales_total: sql<string>`coalesce(sum(${sales.salePrice}) filter (where ${sales.status} = 'ACTIVE' and ${sales.soldAt} >= ${startIso}::timestamptz and ${sales.soldAt} <= ${endIso}::timestamptz), 0)::text`,
        })
        .from(sales),
      db
        .select({
          payments_total: sql<string>`coalesce(sum(${payments.amount}) filter (where ${payments.isVoided} = false and ${payments.paidAt} >= ${startIso}::timestamptz and ${payments.paidAt} <= ${endIso}::timestamptz), 0)::text`,
        })
        .from(payments),
      db
        .select({
          refunds_count: sql<number>`count(*) filter (where ${refunds.paidAt} >= ${startIso}::timestamptz and ${refunds.paidAt} <= ${endIso}::timestamptz)::int`,
          refunds_total: sql<string>`coalesce(sum(${refunds.refundAmount}) filter (where ${refunds.paidAt} >= ${startIso}::timestamptz and ${refunds.paidAt} <= ${endIso}::timestamptz), 0)::text`,
        })
        .from(refunds),
      db
        .select({
          buybacks_count: sql<number>`count(*) filter (where ${buybacks.paidAt} >= ${startIso}::timestamptz and ${buybacks.paidAt} <= ${endIso}::timestamptz)::int`,
          buybacks_total: sql<string>`coalesce(sum(${buybacks.buybackAmount}) filter (where ${buybacks.paidAt} >= ${startIso}::timestamptz and ${buybacks.paidAt} <= ${endIso}::timestamptz), 0)::text`,
        })
        .from(buybacks),
    ]);

  const [bookingsRows, overdueRows, monthlyQuery, floorRows, categoryRows] =
    await Promise.all([
      db
        .select({
          receivables_total: sql<string>`coalesce(sum(${bookings.netPrice} - ${bookings.paidTotal}) filter (where ${bookings.status} = 'ACTIVE'), 0)::text`,
          discounts_count: sql<number>`count(*) filter (where ${bookings.createdAt} >= ${startIso}::timestamptz and ${bookings.createdAt} <= ${endIso}::timestamptz and ${bookings.discountValue} > 0)::int`,
          discounts_total: sql<string>`coalesce(sum(${bookings.discountValue}) filter (where ${bookings.createdAt} >= ${startIso}::timestamptz and ${bookings.createdAt} <= ${endIso}::timestamptz and ${bookings.discountValue} > 0), 0)::text`,
        })
        .from(bookings),
      db
        .select({
          overdue_count: sql<number>`count(*) filter (where ${bookings.status} = 'ACTIVE' and ${installments.status} in ('PENDING', 'PARTIAL', 'OVERDUE') and ${installments.paidAmount} < ${installments.amount} and ${installments.dueDate} <= ${nowIso}::timestamptz)::int`,
          overdue_total: sql<string>`coalesce(sum(${installments.amount} - ${installments.paidAmount}) filter (where ${bookings.status} = 'ACTIVE' and ${installments.status} in ('PENDING', 'PARTIAL', 'OVERDUE') and ${installments.paidAmount} < ${installments.amount} and ${installments.dueDate} <= ${nowIso}::timestamptz), 0)::text`,
        })
        .from(installments)
        .innerJoin(bookings, eq(installments.bookingId, bookings.id)),
      db
        .select({
          monthKey: sql<string>`to_char(${payments.paidAt}, 'YYYY-MM')`,
          total: sql<string>`coalesce(sum(${payments.amount}), 0)::text`,
        })
        .from(payments)
        .where(and(eq(payments.isVoided, false), gte(payments.paidAt, twelveMonthsAgo)))
        .groupBy(sql`to_char(${payments.paidAt}, 'YYYY-MM')`)
        .orderBy(sql`to_char(${payments.paidAt}, 'YYYY-MM')`),
      db
        .select({
          floorId: floors.id,
          floorName: floors.name,
          level: floors.level,
          blockName: blocks.name,
          totalUnits: sql<number>`count(${units.id})::int`,
          availableCount: sql<number>`count(case when ${units.status} = 'AVAILABLE' then 1 end)::int`,
          bookedCount: sql<number>`count(case when ${units.status} = 'BOOKED' then 1 end)::int`,
          soldCount: sql<number>`count(case when ${units.status} = 'SOLD' then 1 end)::int`,
          totalValue: sql<string>`coalesce(sum(case when ${units.status} = 'SOLD' then coalesce(${units.soldPricePkr}, ${computedPriceSql}) else ${computedPriceSql} end), 0)::text`,
          soldValue: sql<string>`coalesce(sum(case when ${units.status} = 'SOLD' then coalesce(${units.soldPricePkr}, ${computedPriceSql}) else 0 end), 0)::text`,
        })
        .from(floors)
        .innerJoin(blocks, eq(floors.blockId, blocks.id))
        .leftJoin(units, and(eq(units.floorId, floors.id), isNull(units.archivedAt)))
        .groupBy(floors.id, floors.name, floors.level, blocks.name)
        .orderBy(asc(floors.level)),
      db
        .select({
          categoryId: categories.id,
          categoryName: categories.name,
          totalUnits: sql<number>`count(${units.id})::int`,
          availableCount: sql<number>`count(case when ${units.status} = 'AVAILABLE' then 1 end)::int`,
          bookedCount: sql<number>`count(case when ${units.status} = 'BOOKED' then 1 end)::int`,
          soldCount: sql<number>`count(case when ${units.status} = 'SOLD' then 1 end)::int`,
          totalValue: sql<string>`coalesce(sum(case when ${units.status} = 'SOLD' then coalesce(${units.soldPricePkr}, ${computedPriceSql}) else ${computedPriceSql} end), 0)::text`,
          soldValue: sql<string>`coalesce(sum(case when ${units.status} = 'SOLD' then coalesce(${units.soldPricePkr}, ${computedPriceSql}) else 0 end), 0)::text`,
        })
        .from(categories)
        .leftJoin(
          units,
          and(eq(units.categoryId, categories.id), isNull(units.archivedAt)),
        )
        .groupBy(categories.id, categories.name)
        .orderBy(asc(categories.name)),
    ]);

  const [salesAgg] = salesRows;
  const [paymentsAgg] = paymentsRows;
  const [refundsAgg] = refundsRows;
  const [buybacksAgg] = buybacksRows;
  const [bookingsAgg] = bookingsRows;
  const [overdueAgg] = overdueRows;

  const unitsByStatus = {
    available: { count: 0, valuePkr: "0.00" },
    reserved: { count: 0, valuePkr: "0.00" },
    booked: { count: 0, valuePkr: "0.00" },
    sold: { count: 0, valuePkr: "0.00" },
    total: { count: 0, valuePkr: "0.00" },
  };

  let totalUnitCount = 0;
  let totalUnitPaisa = 0n;

  for (const row of statusStatsQuery) {
    const valPaisa = parseDecimal(row.totalValue || "0");
    totalUnitCount += Number(row.count);
    totalUnitPaisa += valPaisa;

    if (row.status === "AVAILABLE") {
      unitsByStatus.available = {
        count: Number(row.count),
        valuePkr: formatDecimal(valPaisa),
      };
    } else if (row.status === "RESERVED") {
      unitsByStatus.reserved = {
        count: Number(row.count),
        valuePkr: formatDecimal(valPaisa),
      };
    } else if (row.status === "BOOKED") {
      unitsByStatus.booked = {
        count: Number(row.count),
        valuePkr: formatDecimal(valPaisa),
      };
    } else if (row.status === "SOLD") {
      unitsByStatus.sold = {
        count: Number(row.count),
        valuePkr: formatDecimal(valPaisa),
      };
    }
  }

  unitsByStatus.total = {
    count: totalUnitCount,
    valuePkr: formatDecimal(totalUnitPaisa),
  };

  const salesValuePkr = salesAgg?.sales_total || "0.00";
  const salesCount = Number(salesAgg?.sales_count || 0);

  const grossCollectedPaisa = parseDecimal(paymentsAgg?.payments_total || "0");
  const refundsPaisa = parseDecimal(refundsAgg?.refunds_total || "0");
  const refundsCount = Number(refundsAgg?.refunds_count || 0);
  const buybacksPaisa = parseDecimal(buybacksAgg?.buybacks_total || "0");
  const buybacksCount = Number(buybacksAgg?.buybacks_count || 0);

  const netCollectedPaisa = grossCollectedPaisa - refundsPaisa - buybacksPaisa;
  const outstandingReceivablesPkr = bookingsAgg?.receivables_total || "0.00";
  const overdueAmountPkr = overdueAgg?.overdue_total || "0.00";
  const overdueCount = Number(overdueAgg?.overdue_count || 0);
  const discountsGivenPkr = bookingsAgg?.discounts_total || "0.00";
  const discountsCount = Number(bookingsAgg?.discounts_count || 0);

  const monthlyCollections = monthlyQuery.map((m) => {
    const [year, month] = m.monthKey.split("-");
    const d = new Date(Number(year), Number(month) - 1, 1);
    const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    const paisa = parseDecimal(m.total || "0");
    return {
      month: m.monthKey,
      label,
      collectedPkr: formatDecimal(paisa),
      amount: Number(paisa) / 100,
    };
  });

  const floorBreakdown = floorRows.map((f) => ({
    floorId: f.floorId,
    floorName: f.floorName,
    level: f.level,
    blockName: f.blockName,
    totalUnits: Number(f.totalUnits || 0),
    availableCount: Number(f.availableCount || 0),
    bookedCount: Number(f.bookedCount || 0),
    soldCount: Number(f.soldCount || 0),
    totalValuePkr: formatDecimal(parseDecimal(f.totalValue || "0")),
    soldValuePkr: formatDecimal(parseDecimal(f.soldValue || "0")),
  }));

  const categoryBreakdown = categoryRows.map((c) => ({
    categoryId: c.categoryId,
    categoryName: c.categoryName,
    totalUnits: Number(c.totalUnits || 0),
    availableCount: Number(c.availableCount || 0),
    bookedCount: Number(c.bookedCount || 0),
    soldCount: Number(c.soldCount || 0),
    totalValuePkr: formatDecimal(parseDecimal(c.totalValue || "0")),
    soldValuePkr: formatDecimal(parseDecimal(c.soldValue || "0")),
  }));

  const result: SummaryReportData = {
    period: {
      startDate: startDate.toISOString().split("T")[0]!,
      endDate: endDate.toISOString().split("T")[0]!,
    },
    unitsByStatus,
    periodMetrics: {
      salesValuePkr,
      salesCount,
      collectedPkr: formatDecimal(netCollectedPaisa),
      grossCollectedPkr: formatDecimal(grossCollectedPaisa),
      outstandingReceivablesPkr,
      overdueAmountPkr,
      overdueCount,
      discountsGivenPkr,
      discountsCount,
      refunds: { count: refundsCount, totalPkr: formatDecimal(refundsPaisa) },
      buybacks: { count: buybacksCount, totalPkr: formatDecimal(buybacksPaisa) },
    },
    monthlyCollections,
    floorBreakdown,
    categoryBreakdown,
  };

  const durationMs = Math.round(performance.now() - t0);
  logger.info({ durationMs, filters }, "server timing: summary report");
  return result;
}

// -------------------------------------------------------------
// B) SOLD UNITS REPORT
// -------------------------------------------------------------

export interface SoldUnitsReportRow {
  saleId: string;
  unitId: string;
  unitCode: string;
  floorName: string;
  categoryName: string;
  netAreaSqft: string;
  clientName: string;
  clientCnic: string;
  listPrice: string;
  discount: string;
  salePrice: string;
  soldDate: Date;
  source: "Booking" | "Direct Sale";
  isBoughtBack: boolean;
}

export interface SoldUnitsReportData {
  rows: SoldUnitsReportRow[];
  kpi: {
    totalSoldUnits: number;
    totalSalesValuePkr: string;
    averageRatePerSqftPkr: string;
    boughtBackCount: number;
  };
}

export async function getSoldUnitsReport(
  filters: ReportFilters,
): Promise<SoldUnitsReportData> {
  const { startDate, endDate } = resolvePresetDates(
    filters.preset,
    filters.startDate,
    filters.endDate,
  );

  const conditions = [gte(sales.soldAt, startDate), lte(sales.soldAt, endDate)];

  if (filters.floorId && filters.floorId !== "ALL") {
    conditions.push(eq(units.floorId, filters.floorId));
  }
  if (filters.categoryId && filters.categoryId !== "ALL") {
    conditions.push(eq(units.categoryId, filters.categoryId));
  }
  if (filters.q && filters.q.trim()) {
    const term = `%${filters.q.trim()}%`;
    conditions.push(
      or(
        ilike(units.unitCode, term),
        ilike(clients.fullName, term),
        ilike(clients.cnic, term),
      )!,
    );
  }

  const rows = await db
    .select({
      saleId: sales.id,
      unitId: units.id,
      unitCode: units.unitCode,
      floorName: floors.name,
      categoryName: categories.name,
      netAreaSqft: units.netAreaSqft,
      grossAreaSqft: units.grossAreaSqft,
      clientName: clients.fullName,
      clientCnic: clients.cnic,
      salePrice: sales.salePrice,
      soldDate: sales.soldAt,
      saleStatus: sales.status,
      bookingId: sales.bookingId,
      bookingListPrice: bookings.listPrice,
      bookingDiscount: bookings.discountValue,
      unitAskingPrice: sql<string>`coalesce(round((${units.ratePerSqftPkr} * coalesce(${units.grossAreaSqft}, ${units.netAreaSqft})) + coalesce(${units.priceAdjustmentPkr}, 0), 0)::numeric(14, 2), '0.00')`,
    })
    .from(sales)
    .innerJoin(units, eq(sales.unitId, units.id))
    .innerJoin(floors, eq(units.floorId, floors.id))
    .innerJoin(categories, eq(units.categoryId, categories.id))
    .innerJoin(clients, eq(sales.clientId, clients.id))
    .leftJoin(bookings, eq(sales.bookingId, bookings.id))
    .where(and(...conditions))
    .orderBy(desc(sales.soldAt));

  let totalSalesPaisa = 0n;
  let totalAreaPaisa = 0n;
  let boughtBackCount = 0;

  const formattedRows: SoldUnitsReportRow[] = rows.map((r) => {
    const salePaisa = parseDecimal(r.salePrice);
    totalSalesPaisa += salePaisa;

    const areaPaisa = parseDecimal(r.netAreaSqft || "0");
    totalAreaPaisa += areaPaisa;

    const isBoughtBack = r.saleStatus === "BOUGHT_BACK";
    if (isBoughtBack) {
      boughtBackCount++;
    }

    const listPrice = r.bookingListPrice || r.unitAskingPrice || r.salePrice;
    const discount = r.bookingDiscount || "0.00";

    return {
      saleId: r.saleId,
      unitId: r.unitId,
      unitCode: r.unitCode,
      floorName: r.floorName,
      categoryName: r.categoryName,
      netAreaSqft: r.netAreaSqft,
      clientName: r.clientName,
      clientCnic: r.clientCnic,
      listPrice,
      discount,
      salePrice: r.salePrice,
      soldDate: r.soldDate,
      source: r.bookingId ? "Booking" : "Direct Sale",
      isBoughtBack,
    };
  });

  const avgRatePerSqft =
    totalAreaPaisa > 0n
      ? formatDecimal((totalSalesPaisa * 100n) / totalAreaPaisa)
      : "0.00";

  return {
    rows: formattedRows,
    kpi: {
      totalSoldUnits: formattedRows.length,
      totalSalesValuePkr: formatDecimal(totalSalesPaisa),
      averageRatePerSqftPkr: avgRatePerSqft,
      boughtBackCount,
    },
  };
}

// -------------------------------------------------------------
// C) BOOKED UNITS REPORT
// -------------------------------------------------------------

export interface BookedUnitsReportRow {
  bookingId: string;
  bookingNo: string;
  unitId: string;
  unitCode: string;
  clientName: string;
  clientCnic: string;
  clientPhone: string;
  netPrice: string;
  paid: string;
  balance: string;
  paidPercent: number;
  plan: string;
  nextDueDate: Date | null;
  overdueAmount: string;
  status: string;
}

export interface BookedUnitsReportData {
  rows: BookedUnitsReportRow[];
  kpi: {
    totalBookings: number;
    totalNetPricePkr: string;
    totalPaidPkr: string;
    totalBalancePkr: string;
    totalOverduePkr: string;
  };
}

export async function getBookedUnitsReport(
  filters: ReportFilters,
): Promise<BookedUnitsReportData> {
  const { startDate, endDate } = resolvePresetDates(
    filters.preset,
    filters.startDate,
    filters.endDate,
  );
  const now = new Date();

  const conditions = [
    gte(bookings.createdAt, startDate),
    lte(bookings.createdAt, endDate),
  ];

  if (filters.status && filters.status !== "ALL") {
    conditions.push(eq(bookings.status, filters.status as BookingStatus));
  }
  if (filters.floorId && filters.floorId !== "ALL") {
    conditions.push(eq(units.floorId, filters.floorId));
  }
  if (filters.categoryId && filters.categoryId !== "ALL") {
    conditions.push(eq(units.categoryId, filters.categoryId));
  }
  if (filters.q && filters.q.trim()) {
    const term = `%${filters.q.trim()}%`;
    conditions.push(
      or(
        ilike(bookings.bookingNo, term),
        ilike(units.unitCode, term),
        ilike(clients.fullName, term),
        ilike(clients.cnic, term),
        ilike(clients.phone, term),
      )!,
    );
  }

  const rows = await db
    .select({
      bookingId: bookings.id,
      bookingNo: bookings.bookingNo,
      unitId: units.id,
      unitCode: units.unitCode,
      clientName: clients.fullName,
      clientCnic: clients.cnic,
      clientPhone: clients.phone,
      netPrice: bookings.netPrice,
      paidTotal: bookings.paidTotal,
      plan: bookings.plan,
      status: bookings.status,
    })
    .from(bookings)
    .innerJoin(units, eq(bookings.unitId, units.id))
    .innerJoin(clients, eq(bookings.clientId, clients.id))
    .where(and(...conditions))
    .orderBy(desc(bookings.createdAt));

  // Fetch unpaid installments for these bookings to find nextDueDate and overdueAmount
  const allInst =
    rows.length > 0
      ? await db
          .select({
            bookingId: installments.bookingId,
            dueDate: installments.dueDate,
            amount: installments.amount,
            paidAmount: installments.paidAmount,
            status: installments.status,
          })
          .from(installments)
          .where(
            and(
              inArray(
                installments.bookingId,
                rows.map((r) => r.bookingId),
              ),
              inArray(installments.status, ["PENDING", "PARTIAL", "OVERDUE"]),
            ),
          )
          .orderBy(asc(installments.dueDate))
      : [];

  const instByBooking = new Map<string, Array<{ dueDate: Date; balancePaisa: bigint }>>();

  for (const inst of allInst) {
    const amtP = parseDecimal(inst.amount);
    const paidP = parseDecimal(inst.paidAmount);
    const balP = amtP - paidP;
    if (balP > 0n) {
      const list = instByBooking.get(inst.bookingId) || [];
      list.push({ dueDate: inst.dueDate, balancePaisa: balP });
      instByBooking.set(inst.bookingId, list);
    }
  }

  let totalNetPaisa = 0n;
  let totalPaidPaisa = 0n;
  let totalBalPaisa = 0n;
  let totalOverduePaisa = 0n;

  const formattedRows: BookedUnitsReportRow[] = rows.map((b) => {
    const netP = parseDecimal(b.netPrice);
    const paidP = parseDecimal(b.paidTotal);
    const balP = netP > paidP ? netP - paidP : 0n;

    totalNetPaisa += netP;
    totalPaidPaisa += paidP;
    totalBalPaisa += balP;

    const paidPercent =
      netP > 0n ? Math.min(100, Math.round(Number((paidP * 10_000n) / netP) / 100)) : 0;

    const instList = instByBooking.get(b.bookingId) || [];
    const nextDueDate = instList.length > 0 ? instList[0]!.dueDate : null;

    let overduePaisa = 0n;
    for (const inst of instList) {
      if (inst.dueDate < now) {
        overduePaisa += inst.balancePaisa;
      }
    }
    totalOverduePaisa += overduePaisa;

    return {
      bookingId: b.bookingId,
      bookingNo: b.bookingNo,
      unitId: b.unitId,
      unitCode: b.unitCode,
      clientName: b.clientName,
      clientCnic: b.clientCnic,
      clientPhone: b.clientPhone,
      netPrice: b.netPrice,
      paid: b.paidTotal,
      balance: formatDecimal(balP),
      paidPercent,
      plan: b.plan,
      nextDueDate,
      overdueAmount: formatDecimal(overduePaisa),
      status: b.status,
    };
  });

  return {
    rows: formattedRows,
    kpi: {
      totalBookings: formattedRows.length,
      totalNetPricePkr: formatDecimal(totalNetPaisa),
      totalPaidPkr: formatDecimal(totalPaidPaisa),
      totalBalancePkr: formatDecimal(totalBalPaisa),
      totalOverduePkr: formatDecimal(totalOverduePaisa),
    },
  };
}

// -------------------------------------------------------------
// D) RESERVED UNITS REPORT
// -------------------------------------------------------------

export interface ReservedUnitsReportRow {
  reservationId: string;
  unitId: string;
  unitCode: string;
  floorName: string;
  clientName: string;
  clientPhone: string;
  reservedOn: Date;
  expiresAt: Date;
  timeLeft: string;
  isExpired: boolean;
  tokenAmountPkr: string;
  tokenReceiptNo?: string | null;
  status: string;
}

export interface ReservedUnitsReportData {
  rows: ReservedUnitsReportRow[];
  kpi: {
    totalReserved: number;
    activeCount: number;
    convertedCount: number;
    expiredCount: number;
    cancelledCount: number;
    totalTokenAmountPkr: string;
    tokenCount: number;
  };
}

export async function getReservedUnitsReport(
  filters: ReportFilters,
): Promise<ReservedUnitsReportData> {
  const { startDate, endDate } = resolvePresetDates(
    filters.preset,
    filters.startDate,
    filters.endDate,
  );
  const now = new Date();

  const conditions = [
    gte(reservations.startAt, startDate),
    lte(reservations.startAt, endDate),
  ];

  if (filters.status && filters.status !== "ALL") {
    conditions.push(eq(reservations.status, filters.status as ReservationStatus));
  }
  if (filters.floorId && filters.floorId !== "ALL") {
    conditions.push(eq(units.floorId, filters.floorId));
  }
  if (filters.q && filters.q.trim()) {
    const term = `%${filters.q.trim()}%`;
    conditions.push(
      or(
        ilike(units.unitCode, term),
        ilike(clients.fullName, term),
        ilike(clients.phone, term),
      )!,
    );
  }

  const rows = await db
    .select({
      reservationId: reservations.id,
      unitId: units.id,
      unitCode: units.unitCode,
      floorName: floors.name,
      clientName: clients.fullName,
      clientPhone: clients.phone,
      startAt: reservations.startAt,
      expiresAt: reservations.expiresAt,
      tokenAmount: reservations.tokenAmount,
      tokenReceiptNo: reservations.tokenReceiptNo,
      status: reservations.status,
    })
    .from(reservations)
    .innerJoin(units, eq(reservations.unitId, units.id))
    .innerJoin(floors, eq(units.floorId, floors.id))
    .innerJoin(clients, eq(reservations.clientId, clients.id))
    .where(and(...conditions))
    .orderBy(desc(reservations.startAt));

  let activeCount = 0;
  let convertedCount = 0;
  let expiredCount = 0;
  let cancelledCount = 0;
  let totalTokenPaisa = 0n;
  let tokenCount = 0;

  const formattedRows: ReservedUnitsReportRow[] = rows.map((r) => {
    const isExpired = r.expiresAt.getTime() < now.getTime();
    if (r.status === "ACTIVE") {
      if (isExpired) expiredCount++;
      else activeCount++;
    } else if (r.status === "CONVERTED") {
      convertedCount++;
    } else if (r.status === "EXPIRED") {
      expiredCount++;
    } else if (r.status === "CANCELLED") {
      cancelledCount++;
    }

    const tPaisa = parseDecimal(r.tokenAmount || "0");
    if (tPaisa > 0n) {
      totalTokenPaisa += tPaisa;
      tokenCount++;
    }

    let timeLeft = "";
    if (r.status === "ACTIVE") {
      const diffMs = r.expiresAt.getTime() - now.getTime();
      if (diffMs > 0) {
        const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
        const hours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        timeLeft = days > 0 ? `${days}d ${hours}h left` : `${hours}h left`;
      } else {
        timeLeft = "Expired";
      }
    } else {
      timeLeft = r.status.toLowerCase();
    }

    return {
      reservationId: r.reservationId,
      unitId: r.unitId,
      unitCode: r.unitCode,
      floorName: r.floorName,
      clientName: r.clientName,
      clientPhone: r.clientPhone,
      reservedOn: r.startAt,
      expiresAt: r.expiresAt,
      timeLeft,
      isExpired,
      tokenAmountPkr: r.tokenAmount || "0.00",
      tokenReceiptNo: r.tokenReceiptNo || null,
      status: r.status,
    };
  });

  return {
    rows: formattedRows,
    kpi: {
      totalReserved: formattedRows.length,
      activeCount,
      convertedCount,
      expiredCount,
      cancelledCount,
      totalTokenAmountPkr: formatDecimal(totalTokenPaisa),
      tokenCount,
    },
  };
}

// -------------------------------------------------------------
// E) INSTALLMENTS REPORT
// -------------------------------------------------------------

export interface InstallmentsReportRow {
  installmentId: string;
  bookingId: string;
  bookingNo: string;
  clientName: string;
  unitCode: string;
  seq: number;
  dueDate: Date;
  amount: string;
  paid: string;
  balance: string;
  status: string;
  receiptNos: string | null;
}

export interface InstallmentsReportData {
  rows: InstallmentsReportRow[];
  kpi: {
    totalCount: number;
    totalDuePkr: string;
    totalPaidPkr: string;
    totalBalancePkr: string;
    overdueCount: number;
    overduePkr: string;
  };
}

export async function getInstallmentsReport(
  filters: ReportFilters,
): Promise<InstallmentsReportData> {
  const { startDate, endDate } = resolvePresetDates(
    filters.preset,
    filters.startDate,
    filters.endDate,
  );
  const now = new Date();

  const conditions = [];

  // Quick filters take precedence if specified
  if (filters.quickFilter === "due_this_week") {
    const startOfWeek = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
    );
    const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
    conditions.push(gte(installments.dueDate, startOfWeek));
    conditions.push(lte(installments.dueDate, endOfWeek));
    conditions.push(sql`${installments.paidAmount} < ${installments.amount}`);
  } else if (filters.quickFilter === "due_this_month") {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    conditions.push(gte(installments.dueDate, startOfMonth));
    conditions.push(lte(installments.dueDate, endOfMonth));
    conditions.push(sql`${installments.paidAmount} < ${installments.amount}`);
  } else if (filters.quickFilter === "overdue") {
    conditions.push(lte(installments.dueDate, now));
    conditions.push(sql`${installments.paidAmount} < ${installments.amount}`);
  } else {
    // Normal date filter
    conditions.push(gte(installments.dueDate, startDate));
    conditions.push(lte(installments.dueDate, endDate));
  }

  if (filters.status && filters.status !== "ALL") {
    conditions.push(eq(installments.status, filters.status as InstallmentStatus));
  }
  if (filters.floorId && filters.floorId !== "ALL") {
    conditions.push(eq(units.floorId, filters.floorId));
  }
  if (filters.q && filters.q.trim()) {
    const term = `%${filters.q.trim()}%`;
    conditions.push(
      or(
        ilike(bookings.bookingNo, term),
        ilike(units.unitCode, term),
        ilike(clients.fullName, term),
      )!,
    );
  }

  const rows = await db
    .select({
      installmentId: installments.id,
      bookingId: bookings.id,
      bookingNo: bookings.bookingNo,
      clientName: clients.fullName,
      unitCode: units.unitCode,
      seq: installments.seq,
      dueDate: installments.dueDate,
      amount: installments.amount,
      paidAmount: installments.paidAmount,
      status: installments.status,
      receiptNos: installments.receiptNos,
    })
    .from(installments)
    .innerJoin(bookings, eq(installments.bookingId, bookings.id))
    .innerJoin(units, eq(bookings.unitId, units.id))
    .innerJoin(clients, eq(bookings.clientId, clients.id))
    .where(and(...conditions))
    .orderBy(asc(installments.dueDate), asc(installments.seq));

  let totalDuePaisa = 0n;
  let totalPaidPaisa = 0n;
  let totalBalPaisa = 0n;
  let overduePaisa = 0n;
  let overdueCount = 0;

  const formattedRows: InstallmentsReportRow[] = rows.map((r) => {
    const dueP = parseDecimal(r.amount);
    const paidP = parseDecimal(r.paidAmount);
    const balP = dueP > paidP ? dueP - paidP : 0n;

    totalDuePaisa += dueP;
    totalPaidPaisa += paidP;
    totalBalPaisa += balP;

    if (r.dueDate < now && balP > 0n) {
      overduePaisa += balP;
      overdueCount++;
    }

    return {
      installmentId: r.installmentId,
      bookingId: r.bookingId,
      bookingNo: r.bookingNo,
      clientName: r.clientName,
      unitCode: r.unitCode,
      seq: r.seq,
      dueDate: r.dueDate,
      amount: r.amount,
      paid: r.paidAmount,
      balance: formatDecimal(balP),
      status: r.status,
      receiptNos: r.receiptNos,
    };
  });

  return {
    rows: formattedRows,
    kpi: {
      totalCount: formattedRows.length,
      totalDuePkr: formatDecimal(totalDuePaisa),
      totalPaidPkr: formatDecimal(totalPaidPaisa),
      totalBalancePkr: formatDecimal(totalBalPaisa),
      overdueCount,
      overduePkr: formatDecimal(overduePaisa),
    },
  };
}

// -------------------------------------------------------------
// F) CLIENT LEDGER REPORT
// -------------------------------------------------------------

export interface ClientLedgerScheduleRow {
  seq: number;
  label: string;
  type?: string;
  dueDate: Date | string;
  amountPkr: string;
  paidDate?: Date | string | null;
  paidAmountPkr?: string | null;
  receiptNo?: string | null;
  surchargePkr?: string | null;
  status: string;
}

export interface ClientLedgerReportData {
  client: {
    id: string;
    title?: string;
    fullName: string;
    relationPrefix?: string;
    relationName?: string;
    cnic: string;
    phone: string;
    email: string | null;
    homeAddress: string;
    postalAddress: string;
  };
  nextOfKin: {
    name: string;
    relation: string;
    cnic: string | null;
    phone: string;
    address: string | null;
  } | null;
  units: Array<{
    unitId: string;
    unitCode: string;
    floorName: string;
    categoryName?: string;
    grossAreaSqft?: string | null;
    netAreaSqft?: string | null;
    relationType: "RESERVED" | "BOOKED" | "SOLD" | "RETURNED" | "BOUGHT_BACK";
    bookingId?: string | null;
    saleId?: string | null;
    date: Date;
    amountPkr: string;
  }>;
  selectedUnitId?: string | null;
  requiresUnitSelection?: boolean;
  selectedUnitDetails?: {
    unitId: string;
    unitCode: string;
    floorName: string;
    categoryName: string;
    grossAreaSqft: string;
    netAreaSqft: string;
    bookingNo: string | null;
    applicationFormNo: string | null;
    plan: string | null;
    status: string;
  } | null;
  financials?: {
    listPrice: string;
    discountValue: string;
    netPrice: string;
    downPayment: string;
    paidTotal: string;
    remainingAmount: string;
  } | null;
  scheduleRows?: ClientLedgerScheduleRow[];
  statement: {
    period: {
      startDate: string;
      endDate: string;
    };
    openingBalancePkr: string;
    closingBalancePkr: string;
    totalDebitsPkr: string;
    totalCreditsPkr: string;
    entries: Array<{
      date: Date;
      description: string;
      receiptNo?: string | null;
      debitPkr: string;
      creditPkr: string;
      runningBalancePkr: string;
    }>;
  };
}

export async function getClientLedgerReport(
  clientId: string,
  filters: ReportFilters,
): Promise<ClientLedgerReportData | null> {
  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, clientId))
    .limit(1);

  if (!client) {
    return null;
  }

  const { startDate, endDate } = resolvePresetDates(
    filters.preset,
    filters.startDate,
    filters.endDate,
  );

  const [
    [kin],
    clientBookings,
    clientSales,
    clientReservations,
    clientPayments,
    clientInstallments,
    clientRefunds,
    clientBuybacks,
  ] = await Promise.all([
    db.select().from(nextOfKin).where(eq(nextOfKin.clientId, client.id)).limit(1),
    db
      .select({
        id: bookings.id,
        bookingNo: bookings.bookingNo,
        applicationFormNo: bookings.applicationFormNo,
        plan: bookings.plan,
        listPrice: bookings.listPrice,
        discountValue: bookings.discountValue,
        downPayment: bookings.downPayment,
        paidTotal: bookings.paidTotal,
        unitId: units.id,
        unitCode: units.unitCode,
        grossAreaSqft: units.grossAreaSqft,
        netAreaSqft: units.netAreaSqft,
        categoryName: categories.name,
        floorName: floors.name,
        netPrice: bookings.netPrice,
        surchargeExempt: bookings.surchargeExempt,
        status: bookings.status,
        createdAt: bookings.createdAt,
      })
      .from(bookings)
      .innerJoin(units, eq(bookings.unitId, units.id))
      .innerJoin(floors, eq(units.floorId, floors.id))
      .innerJoin(categories, eq(units.categoryId, categories.id))
      .where(eq(bookings.clientId, client.id)),
    db
      .select({
        id: sales.id,
        bookingId: sales.bookingId,
        unitId: units.id,
        unitCode: units.unitCode,
        grossAreaSqft: units.grossAreaSqft,
        netAreaSqft: units.netAreaSqft,
        categoryName: categories.name,
        floorName: floors.name,
        salePrice: sales.salePrice,
        status: sales.status,
        soldAt: sales.soldAt,
      })
      .from(sales)
      .innerJoin(units, eq(sales.unitId, units.id))
      .innerJoin(floors, eq(units.floorId, floors.id))
      .innerJoin(categories, eq(units.categoryId, categories.id))
      .where(eq(sales.clientId, client.id)),
    db
      .select({
        id: reservations.id,
        unitId: units.id,
        unitCode: units.unitCode,
        grossAreaSqft: units.grossAreaSqft,
        netAreaSqft: units.netAreaSqft,
        categoryName: categories.name,
        floorName: floors.name,
        status: reservations.status,
        startAt: reservations.startAt,
        tokenAmount: reservations.tokenAmount,
        tokenReceiptNo: reservations.tokenReceiptNo,
        tokenPaidAt: reservations.tokenPaidAt,
      })
      .from(reservations)
      .innerJoin(units, eq(reservations.unitId, units.id))
      .innerJoin(floors, eq(units.floorId, floors.id))
      .innerJoin(categories, eq(units.categoryId, categories.id))
      .where(eq(reservations.clientId, client.id)),
    db
      .select({
        id: payments.id,
        bookingId: payments.bookingId,
        receiptNo: payments.receiptNo,
        category: payments.category,
        amount: payments.amount,
        surchargeAmount: payments.surchargeAmount,
        paidAt: payments.paidAt,
        method: payments.method,
        notes: payments.notes,
        isVoided: payments.isVoided,
        bookingNo: bookings.bookingNo,
        unitCode: units.unitCode,
        categoryName: categories.name,
      })
      .from(payments)
      .innerJoin(bookings, eq(payments.bookingId, bookings.id))
      .innerJoin(units, eq(bookings.unitId, units.id))
      .innerJoin(categories, eq(units.categoryId, categories.id))
      .where(and(eq(bookings.clientId, client.id), eq(payments.isVoided, false))),
    db
      .select({
        id: installments.id,
        bookingId: installments.bookingId,
        seq: installments.seq,
        label: installments.label,
        type: installments.type,
        dueDate: installments.dueDate,
        amount: installments.amount,
        paidAmount: installments.paidAmount,
        status: installments.status,
        paidAt: installments.paidAt,
        receiptNos: installments.receiptNos,
        surchargeWaived: installments.surchargeWaived,
        surchargeWaivedAmount: installments.surchargeWaivedAmount,
        surchargePaidAmount: installments.surchargePaidAmount,
        bookingNo: bookings.bookingNo,
        bookingSurchargeExempt: bookings.surchargeExempt,
        unitCode: units.unitCode,
        categoryName: categories.name,
      })
      .from(installments)
      .innerJoin(bookings, eq(installments.bookingId, bookings.id))
      .innerJoin(units, eq(bookings.unitId, units.id))
      .innerJoin(categories, eq(units.categoryId, categories.id))
      .where(eq(bookings.clientId, client.id)),
    db
      .select({
        id: refunds.id,
        refundAmount: refunds.refundAmount,
        deduction: refunds.deduction,
        paidAt: refunds.paidAt,
        bookingId: refunds.bookingId,
      })
      .from(refunds)
      .where(eq(refunds.clientId, client.id)),
    db
      .select({
        id: buybacks.id,
        buybackAmount: buybacks.buybackAmount,
        paidAt: buybacks.paidAt,
        reason: buybacks.reason,
      })
      .from(buybacks)
      .where(eq(buybacks.clientId, client.id)),
  ]);

  // 1. Fetch distinct client units
  const associatedUnits: ClientLedgerReportData["units"] = [];
  const seenUnits = new Set<string>();

  for (const b of clientBookings) {
    if (!seenUnits.has(b.unitId)) {
      seenUnits.add(b.unitId);
      associatedUnits.push({
        unitId: b.unitId,
        unitCode: formatUnitDisplayCode(b.unitCode, b.categoryName),
        floorName: b.floorName,
        categoryName: b.categoryName,
        grossAreaSqft: b.grossAreaSqft,
        netAreaSqft: b.netAreaSqft,
        relationType: b.status === "RETURNED" ? "RETURNED" : "BOOKED",
        bookingId: b.id,
        date: b.createdAt,
        amountPkr: b.netPrice,
      });
    }
  }

  for (const s of clientSales) {
    if (!seenUnits.has(s.unitId)) {
      seenUnits.add(s.unitId);
      associatedUnits.push({
        unitId: s.unitId,
        unitCode: formatUnitDisplayCode(s.unitCode, s.categoryName),
        floorName: s.floorName,
        categoryName: s.categoryName,
        grossAreaSqft: s.grossAreaSqft,
        netAreaSqft: s.netAreaSqft,
        relationType: s.status === "BOUGHT_BACK" ? "BOUGHT_BACK" : "SOLD",
        bookingId: s.bookingId,
        saleId: s.id,
        date: s.soldAt,
        amountPkr: s.salePrice,
      });
    }
  }

  for (const r of clientReservations) {
    if (r.status === "ACTIVE" && !seenUnits.has(r.unitId)) {
      seenUnits.add(r.unitId);
      associatedUnits.push({
        unitId: r.unitId,
        unitCode: formatUnitDisplayCode(r.unitCode, r.categoryName),
        floorName: r.floorName,
        categoryName: r.categoryName,
        grossAreaSqft: r.grossAreaSqft,
        netAreaSqft: r.netAreaSqft,
        relationType: "RESERVED",
        date: r.startAt,
        amountPkr: r.tokenAmount || "0.00",
      });
    }
  }

  // Determine Unit Selection (Mandatory if > 1 unit)
  let selectedUnitId: string | null = null;
  let requiresUnitSelection = false;

  if (associatedUnits.length === 0) {
    selectedUnitId = null;
    requiresUnitSelection = false;
  } else if (associatedUnits.length === 1) {
    selectedUnitId = associatedUnits[0]!.unitId;
    requiresUnitSelection = false;
  } else {
    // Client has > 1 unit
    if (filters.unitId && associatedUnits.some((u) => u.unitId === filters.unitId)) {
      selectedUnitId = filters.unitId;
      requiresUnitSelection = false;
    } else {
      selectedUnitId = null;
      requiresUnitSelection = true;
    }
  }

  let selectedUnitDetails: ClientLedgerReportData["selectedUnitDetails"] = null;
  let financials: ClientLedgerReportData["financials"] = null;
  let scheduleRows: ClientLedgerScheduleRow[] = [];

  if (selectedUnitId) {
    const b = clientBookings.find((item) => item.unitId === selectedUnitId);
    if (b) {
      const netNum = Number(b.netPrice) || 0;
      const paidNum = Number(b.paidTotal) || 0;
      const balanceNum = Math.max(0, netNum - paidNum);

      financials = {
        listPrice: b.listPrice,
        discountValue: b.discountValue || "0.00",
        netPrice: b.netPrice,
        downPayment: b.downPayment,
        paidTotal: b.paidTotal,
        remainingAmount: balanceNum.toFixed(2),
      };

      selectedUnitDetails = {
        unitId: b.unitId,
        unitCode: formatUnitDisplayCode(b.unitCode, b.categoryName),
        floorName: b.floorName,
        categoryName: b.categoryName,
        grossAreaSqft: b.grossAreaSqft || "—",
        netAreaSqft: b.netAreaSqft || "—",
        bookingNo: b.bookingNo,
        applicationFormNo: b.applicationFormNo || b.bookingNo,
        plan: b.plan,
        status: b.status,
      };

      const bInstallments = clientInstallments
        .filter((i) => i.bookingId === b.id)
        .sort((x, y) => x.seq - y.seq);

      const downPaymentPayment = clientPayments.find(
        (p) => p.bookingId === b.id && p.category === "DOWN_PAYMENT",
      );

      scheduleRows = [
        {
          seq: 0,
          label: "Down Payment",
          type: "DOWN_PAYMENT",
          dueDate: b.createdAt,
          amountPkr: b.downPayment,
          paidDate: downPaymentPayment?.paidAt ?? b.createdAt,
          paidAmountPkr: downPaymentPayment?.amount ?? b.downPayment,
          receiptNo: downPaymentPayment?.receiptNo ?? "—",
          surchargePkr: "—",
          status: "PAID",
        },
        ...bInstallments.map((inst) => {
          const hasSurcharge =
            inst.surchargePaidAmount && Number(inst.surchargePaidAmount) > 0;
          return {
            seq: inst.seq,
            label: inst.label || `Installment #${inst.seq}`,
            type: inst.type,
            dueDate: inst.dueDate,
            amountPkr: inst.amount,
            paidDate: inst.paidAt ?? null,
            paidAmountPkr: inst.paidAmount,
            receiptNo: inst.receiptNos || "—",
            surchargePkr: hasSurcharge ? inst.surchargePaidAmount! : "—",
            status: inst.status,
          };
        }),
      ];
    } else {
      const s = clientSales.find((item) => item.unitId === selectedUnitId);
      if (s) {
        financials = {
          listPrice: s.salePrice,
          discountValue: "0.00",
          netPrice: s.salePrice,
          downPayment: s.salePrice,
          paidTotal: s.salePrice,
          remainingAmount: "0.00",
        };

        selectedUnitDetails = {
          unitId: s.unitId,
          unitCode: formatUnitDisplayCode(s.unitCode, s.categoryName),
          floorName: s.floorName,
          categoryName: s.categoryName,
          grossAreaSqft: s.grossAreaSqft || "—",
          netAreaSqft: s.netAreaSqft || "—",
          bookingNo: "DIRECT-SALE",
          applicationFormNo: "—",
          plan: "FULL_PAYMENT",
          status: s.status,
        };

        scheduleRows = [
          {
            seq: 0,
            label: "Direct Sale Full Payment",
            type: "FULL_PAYMENT",
            dueDate: s.soldAt,
            amountPkr: s.salePrice,
            paidDate: s.soldAt,
            paidAmountPkr: s.salePrice,
            receiptNo: "—",
            surchargePkr: "—",
            status: "PAID",
          },
        ];
      }
    }
  }

  // 2. Build Raw Ledger Entries for all time
  const rawEntries: LedgerRawEntry[] = [];

  // Credits: Reservation Token Payments
  for (const r of clientReservations) {
    if (parseDecimal(r.tokenAmount || "0") > 0n) {
      rawEntries.push({
        date: r.tokenPaidAt ?? r.startAt,
        description: `Reservation Token (${formatUnitDisplayCode(r.unitCode, r.categoryName)})`,
        receiptNo: r.tokenReceiptNo,
        debitPkr: "0.00",
        creditPkr: r.tokenAmount,
      });
    }
  }

  // Debits: Bookings (contract price owed)
  for (const b of clientBookings) {
    rawEntries.push({
      date: b.createdAt,
      description: `Booking Contract ${b.bookingNo} (${formatUnitDisplayCode(b.unitCode, b.categoryName)})`,
      receiptNo: null,
      debitPkr: b.netPrice,
      creditPkr: "0.00",
    });
  }

  // Debits: Automatic Overdue Surcharges (> 30 days overdue @ 0.1%/day)
  const nowDate = new Date();
  for (const inst of clientInstallments) {
    const sc = calculateInstallmentSurcharge(
      {
        amount: inst.amount,
        paidAmount: inst.paidAmount,
        dueDate: inst.dueDate,
        status: inst.status,
        surchargeWaived: inst.surchargeWaived,
        surchargeWaivedAmount: inst.surchargeWaivedAmount,
        surchargePaidAmount: inst.surchargePaidAmount,
        bookingSurchargeExempt: inst.bookingSurchargeExempt,
      },
      nowDate,
    );
    const totalEffectiveSurcharge = parseDecimal(sc.netDuePkr) + parseDecimal(sc.paidPkr);
    if (totalEffectiveSurcharge > 0n) {
      rawEntries.push({
        date: new Date(new Date(inst.dueDate).getTime() + 31 * 86_400_000),
        description: `Late Payment Surcharge — ${inst.label || `Installment #${inst.seq}`} (${sc.chargeableDays}d beyond 30d grace @ 0.1%/day · ${formatUnitDisplayCode(inst.unitCode, inst.categoryName)})`,
        receiptNo: null,
        debitPkr: formatDecimal(totalEffectiveSurcharge),
        creditPkr: "0.00",
      });
    }
  }

  // Direct Sales (if any without booking)
  for (const s of clientSales) {
    if (!s.bookingId) {
      rawEntries.push({
        date: s.soldAt,
        description: `Direct Sale (${formatUnitDisplayCode(s.unitCode, s.categoryName)})`,
        receiptNo: null,
        debitPkr: s.salePrice,
        creditPkr: "0.00",
      });
    }
  }

  // Credits: Payments made by this client
  for (const p of clientPayments) {
    const catLabel = p.category.replace(/_/g, " ");
    rawEntries.push({
      date: p.paidAt,
      description: `${catLabel} Receipt (${p.bookingNo}, ${formatUnitDisplayCode(p.unitCode, p.categoryName)})`,
      receiptNo: p.receiptNo,
      debitPkr: "0.00",
      creditPkr: p.amount,
    });
  }

  // Refunds
  for (const ref of clientRefunds) {
    // When a booking was cancelled/returned, the original debit contract was reversed
    rawEntries.push({
      date: ref.paidAt,
      description: `Refund Issued on Booking Cancellation (Deduction Rs ${ref.deduction})`,
      receiptNo: null,
      debitPkr: "0.00",
      creditPkr: ref.refundAmount,
    });
  }

  // Buybacks
  for (const bb of clientBuybacks) {
    rawEntries.push({
      date: bb.paidAt,
      description: `Buyback Payout (${bb.reason})`,
      receiptNo: null,
      debitPkr: "0.00",
      creditPkr: bb.buybackAmount,
    });
  }

  // Run calculateClientLedger with selected date period
  const statement = calculateClientLedger(rawEntries, startDate, endDate);

  return {
    client: {
      id: client.id,
      title: client.title,
      fullName: client.fullName,
      relationPrefix: client.relationPrefix,
      relationName: client.relationName,
      cnic: client.cnic,
      phone: client.phone,
      email: client.email,
      homeAddress: client.homeAddress,
      postalAddress: client.postalAddress,
    },
    nextOfKin: kin
      ? {
          name: kin.name,
          relation: kin.relation,
          cnic: kin.cnic,
          phone: kin.phone,
          address: kin.address,
        }
      : null,
    units: associatedUnits,
    selectedUnitId,
    requiresUnitSelection,
    selectedUnitDetails,
    financials,
    scheduleRows,
    statement: {
      period: {
        startDate: startDate.toISOString().split("T")[0]!,
        endDate: endDate.toISOString().split("T")[0]!,
      },
      openingBalancePkr: statement.openingBalancePkr,
      closingBalancePkr: financials
        ? financials.remainingAmount
        : statement.closingBalancePkr,
      totalDebitsPkr: financials ? financials.netPrice : statement.totalDebitsPkr,
      totalCreditsPkr: financials ? financials.paidTotal : statement.totalCreditsPkr,
      entries: statement.entries,
    },
  };
}

export interface DetailedCollectionTxRow {
  id: string;
  date: Date;
  receiptNo: string | null;
  clientName: string;
  clientCnic: string;
  clientPhone: string;
  unitCode: string;
  floorName: string;
  categoryName: string;
  bookingNo: string | null;
  method: string | null;
  amountPkr: string;
  notes: string | null;
  adjustedToBooking?: boolean;
}

export interface SurchargeCollectionRow {
  installmentId: string;
  bookingId: string;
  bookingNo: string;
  clientName: string;
  clientCnic: string;
  unitCode: string;
  floorName: string;
  installmentLabel: string;
  dueDate: Date;
  chargeableDays: number;
  rawAccruedPkr: string;
  waivedPkr: string;
  paidPkr: string;
  netDuePkr: string;
  isExemptOrWaived: boolean;
}

export interface DetailedCollectionsReportData {
  summary: {
    tokenTotalPkr: string;
    tokenCount: number;
    downPaymentTotalPkr: string;
    downPaymentCount: number;
    installmentsTotalPkr: string;
    installmentsCount: number;
    possessionTotalPkr: string;
    possessionCount: number;
    balloonTotalPkr: string;
    balloonCount: number;
    surchargeCollectedPkr: string;
    surchargeWaivedPkr: string;
    surchargeOutstandingPkr: string;
    grandTotalCollectedPkr: string;
  };
  tokens: DetailedCollectionTxRow[];
  downPayments: DetailedCollectionTxRow[];
  installments: DetailedCollectionTxRow[];
  possessions: DetailedCollectionTxRow[];
  balloons: DetailedCollectionTxRow[];
  surcharges: SurchargeCollectionRow[];
}

export async function getDetailedCollectionsReport(
  params: ReportFilters,
): Promise<DetailedCollectionsReportData> {
  const { startDate, endDate } = resolvePresetDates(
    params.preset,
    params.startDate,
    params.endDate,
  );
  const startIso = startDate.toISOString();
  const endIso = endDate.toISOString();

  const floorFilter =
    params.floorId && params.floorId !== "ALL"
      ? eq(units.floorId, params.floorId)
      : undefined;
  const catFilter =
    params.categoryId && params.categoryId !== "ALL"
      ? eq(units.categoryId, params.categoryId)
      : undefined;
  const searchTerm = params.q?.trim() ? `%${params.q.trim()}%` : null;

  const paymentConditions = [
    eq(payments.isVoided, false),
    sql`${payments.paidAt} >= ${startIso}::timestamptz`,
    sql`${payments.paidAt} <= ${endIso}::timestamptz`,
  ];
  if (floorFilter) paymentConditions.push(floorFilter);
  if (catFilter) paymentConditions.push(catFilter);
  if (searchTerm) {
    paymentConditions.push(
      or(
        ilike(clients.fullName, searchTerm),
        ilike(clients.cnic, searchTerm),
        ilike(units.unitCode, searchTerm),
        ilike(payments.receiptNo, searchTerm),
      )!,
    );
  }

  const tokenConditions = [
    sql`${reservations.tokenAmount} > 0`,
    sql`coalesce(${reservations.tokenPaidAt}, ${reservations.startAt}) >= ${startIso}::timestamptz`,
    sql`coalesce(${reservations.tokenPaidAt}, ${reservations.startAt}) <= ${endIso}::timestamptz`,
  ];
  if (floorFilter) tokenConditions.push(floorFilter);
  if (catFilter) tokenConditions.push(catFilter);
  if (searchTerm) {
    tokenConditions.push(
      or(
        ilike(clients.fullName, searchTerm),
        ilike(clients.cnic, searchTerm),
        ilike(units.unitCode, searchTerm),
      )!,
    );
  }

  const instConditions = [eq(bookings.status, "ACTIVE")];
  if (floorFilter) instConditions.push(floorFilter);
  if (catFilter) instConditions.push(catFilter);
  if (searchTerm) {
    instConditions.push(
      or(
        ilike(clients.fullName, searchTerm),
        ilike(clients.cnic, searchTerm),
        ilike(units.unitCode, searchTerm),
      )!,
    );
  }

  const [tokenRows, paymentRows, overdueInstRows] = await Promise.all([
    db
      .select({
        id: reservations.id,
        date: sql<Date>`coalesce(${reservations.tokenPaidAt}, ${reservations.startAt})`,
        receiptNo: reservations.tokenReceiptNo,
        clientName: clients.fullName,
        clientCnic: clients.cnic,
        clientPhone: clients.phone,
        unitCode: units.unitCode,
        floorName: floors.name,
        categoryName: categories.name,
        method: reservations.tokenPaymentMethod,
        amountPkr: reservations.tokenAmount,
        notes: reservations.notes,
        tokenAdjustedToBookingId: reservations.tokenAdjustedToBookingId,
      })
      .from(reservations)
      .innerJoin(units, eq(reservations.unitId, units.id))
      .innerJoin(floors, eq(units.floorId, floors.id))
      .innerJoin(categories, eq(units.categoryId, categories.id))
      .innerJoin(clients, eq(reservations.clientId, clients.id))
      .where(and(...tokenConditions))
      .orderBy(desc(reservations.startAt)),
    db
      .select({
        id: payments.id,
        date: payments.paidAt,
        receiptNo: payments.receiptNo,
        category: payments.category,
        amount: payments.amount,
        surchargeAmount: payments.surchargeAmount,
        method: payments.method,
        notes: payments.notes,
        bookingNo: bookings.bookingNo,
        clientName: clients.fullName,
        clientCnic: clients.cnic,
        clientPhone: clients.phone,
        unitCode: units.unitCode,
        floorName: floors.name,
        categoryName: categories.name,
      })
      .from(payments)
      .innerJoin(bookings, eq(payments.bookingId, bookings.id))
      .innerJoin(units, eq(bookings.unitId, units.id))
      .innerJoin(floors, eq(units.floorId, floors.id))
      .innerJoin(categories, eq(units.categoryId, categories.id))
      .innerJoin(clients, eq(bookings.clientId, clients.id))
      .where(and(...paymentConditions))
      .orderBy(desc(payments.paidAt)),
    db
      .select({
        installmentId: installments.id,
        bookingId: bookings.id,
        bookingNo: bookings.bookingNo,
        bookingSurchargeExempt: bookings.surchargeExempt,
        clientName: clients.fullName,
        clientCnic: clients.cnic,
        unitCode: units.unitCode,
        floorName: floors.name,
        categoryName: categories.name,
        seq: installments.seq,
        label: installments.label,
        dueDate: installments.dueDate,
        amount: installments.amount,
        paidAmount: installments.paidAmount,
        status: installments.status,
        surchargeWaived: installments.surchargeWaived,
        surchargeWaivedAmount: installments.surchargeWaivedAmount,
        surchargePaidAmount: installments.surchargePaidAmount,
      })
      .from(installments)
      .innerJoin(bookings, eq(installments.bookingId, bookings.id))
      .innerJoin(units, eq(bookings.unitId, units.id))
      .innerJoin(floors, eq(units.floorId, floors.id))
      .innerJoin(categories, eq(units.categoryId, categories.id))
      .innerJoin(clients, eq(bookings.clientId, clients.id))
      .where(and(...instConditions))
      .orderBy(asc(installments.dueDate)),
  ]);

  const tokens: DetailedCollectionTxRow[] = [];
  let tokenTotal = 0n;
  for (const t of tokenRows) {
    tokenTotal += parseDecimal(t.amountPkr);
    tokens.push({
      id: t.id,
      date: new Date(t.date),
      receiptNo: t.receiptNo,
      clientName: t.clientName,
      clientCnic: t.clientCnic,
      clientPhone: t.clientPhone,
      unitCode: formatUnitDisplayCode(t.unitCode, t.categoryName),
      floorName: t.floorName,
      categoryName: t.categoryName,
      bookingNo: null,
      method: t.method,
      amountPkr: t.amountPkr,
      notes: t.notes,
      adjustedToBooking: Boolean(t.tokenAdjustedToBookingId),
    });
  }

  const downPayments: DetailedCollectionTxRow[] = [];
  const installmentCols: DetailedCollectionTxRow[] = [];
  const possessions: DetailedCollectionTxRow[] = [];
  const balloons: DetailedCollectionTxRow[] = [];

  let downTotal = 0n;
  let instTotal = 0n;
  let possTotal = 0n;
  let balloonTotal = 0n;
  let surchargeCollected = 0n;

  for (const p of paymentRows) {
    const amt = parseDecimal(p.amount);
    const sur = parseDecimal(p.surchargeAmount || "0");
    surchargeCollected += p.category === "SURCHARGE" ? amt : sur;

    const principalPart = p.category === "SURCHARGE" ? 0n : amt > sur ? amt - sur : 0n;
    const row: DetailedCollectionTxRow = {
      id: p.id,
      date: new Date(p.date),
      receiptNo: p.receiptNo,
      clientName: p.clientName,
      clientCnic: p.clientCnic,
      clientPhone: p.clientPhone,
      unitCode: formatUnitDisplayCode(p.unitCode, p.categoryName),
      floorName: p.floorName,
      categoryName: p.categoryName,
      bookingNo: p.bookingNo,
      method: p.method,
      amountPkr: formatDecimal(principalPart > 0n ? principalPart : amt),
      notes: p.notes,
    };

    switch (p.category) {
      case "DOWN_PAYMENT":
        downTotal += principalPart;
        downPayments.push(row);
        break;
      case "POSSESSION":
        possTotal += principalPart;
        possessions.push(row);
        break;
      case "BALLOON":
        balloonTotal += principalPart;
        balloons.push(row);
        break;
      case "SURCHARGE":
        break;
      default:
        instTotal += principalPart;
        installmentCols.push(row);
        break;
    }
  }

  const surcharges: SurchargeCollectionRow[] = [];
  let surchargeWaived = 0n;
  let surchargeOutstanding = 0n;
  const now = new Date();

  for (const inst of overdueInstRows) {
    const sc = calculateInstallmentSurcharge(
      {
        amount: inst.amount,
        paidAmount: inst.paidAmount,
        dueDate: inst.dueDate,
        status: inst.status,
        surchargeWaived: inst.surchargeWaived,
        surchargeWaivedAmount: inst.surchargeWaivedAmount,
        surchargePaidAmount: inst.surchargePaidAmount,
        bookingSurchargeExempt: inst.bookingSurchargeExempt,
      },
      now,
    );
    if (
      parseDecimal(sc.rawAccruedPkr) > 0n ||
      parseDecimal(sc.paidPkr) > 0n ||
      parseDecimal(sc.waivedPkr) > 0n
    ) {
      surchargeWaived += parseDecimal(sc.waivedPkr);
      surchargeOutstanding += parseDecimal(sc.netDuePkr);
      surcharges.push({
        installmentId: inst.installmentId,
        bookingId: inst.bookingId,
        bookingNo: inst.bookingNo,
        clientName: inst.clientName,
        clientCnic: inst.clientCnic,
        unitCode: formatUnitDisplayCode(inst.unitCode, inst.categoryName),
        floorName: inst.floorName,
        installmentLabel: inst.label || `Installment #${inst.seq}`,
        dueDate: new Date(inst.dueDate),
        chargeableDays: sc.chargeableDays,
        rawAccruedPkr: sc.rawAccruedPkr,
        waivedPkr: sc.waivedPkr,
        paidPkr: sc.paidPkr,
        netDuePkr: sc.netDuePkr,
        isExemptOrWaived: sc.isExemptOrWaived,
      });
    }
  }

  const grandTotal =
    tokenTotal + downTotal + instTotal + possTotal + balloonTotal + surchargeCollected;

  return {
    summary: {
      tokenTotalPkr: formatDecimal(tokenTotal),
      tokenCount: tokens.length,
      downPaymentTotalPkr: formatDecimal(downTotal),
      downPaymentCount: downPayments.length,
      installmentsTotalPkr: formatDecimal(instTotal),
      installmentsCount: installmentCols.length,
      possessionTotalPkr: formatDecimal(possTotal),
      possessionCount: possessions.length,
      balloonTotalPkr: formatDecimal(balloonTotal),
      balloonCount: balloons.length,
      surchargeCollectedPkr: formatDecimal(surchargeCollected),
      surchargeWaivedPkr: formatDecimal(surchargeWaived),
      surchargeOutstandingPkr: formatDecimal(surchargeOutstanding),
      grandTotalCollectedPkr: formatDecimal(grandTotal),
    },
    tokens,
    downPayments,
    installments: installmentCols,
    possessions,
    balloons,
    surcharges,
  };
}
