import "server-only";

import { cache } from "react";
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
import { db, sql as rawSql } from "@/db";
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

export const getReportFilterOptions = cache(async (): Promise<FilterOptions> => {
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
});

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
  if (filters.floorId && filters.floorId !== "ALL") {
    unitConditions.push(eq(units.floorId, filters.floorId));
  }
  if (filters.categoryId && filters.categoryId !== "ALL") {
    unitConditions.push(eq(units.categoryId, filters.categoryId));
  }

  const computedPriceSql = sql`round((${units.ratePerSqftPkr} * ${units.netAreaSqft}) + coalesce(${units.priceAdjustmentPkr}, 0), 0)::numeric(14, 2)`;

  // Run all report sections in parallel to avoid sequential network roundtrips
  const [statusStatsQuery, [metricsRow], monthlyQuery, floorRows, categoryRows] =
    await Promise.all([
      // 1. Units by status counts & values (direct computation without slow view join)
      db
        .select({
          status: units.status,
          count: sql<number>`count(*)::int`,
          totalValue: sql<string>`coalesce(sum(case when ${units.status} = 'SOLD' then coalesce(${units.soldPricePkr}, ${computedPriceSql}) else ${computedPriceSql} end), 0)::text`,
        })
        .from(units)
        .where(and(...unitConditions))
        .groupBy(units.status),

      // 2. Period metrics consolidated in a single query
      rawSql<
        {
          sales_count: number;
          sales_total: string;
          payments_total: string;
          refunds_count: number;
          refunds_total: string;
          buybacks_count: number;
          buybacks_total: string;
          receivables_total: string;
          overdue_count: number;
          overdue_total: string;
          discounts_count: number;
          discounts_total: string;
        }[]
      >`
        SELECT
          (SELECT count(*)::int FROM sales WHERE status = 'ACTIVE' AND sold_at >= ${startIso} AND sold_at <= ${endIso}) as sales_count,
          (SELECT coalesce(sum(sale_price), 0)::text FROM sales WHERE status = 'ACTIVE' AND sold_at >= ${startIso} AND sold_at <= ${endIso}) as sales_total,
          (SELECT coalesce(sum(amount), 0)::text FROM payments WHERE is_voided = false AND paid_at >= ${startIso} AND paid_at <= ${endIso}) as payments_total,
          (SELECT count(*)::int FROM refunds WHERE paid_at >= ${startIso} AND paid_at <= ${endIso}) as refunds_count,
          (SELECT coalesce(sum(refund_amount), 0)::text FROM refunds WHERE paid_at >= ${startIso} AND paid_at <= ${endIso}) as refunds_total,
          (SELECT count(*)::int FROM buybacks WHERE paid_at >= ${startIso} AND paid_at <= ${endIso}) as buybacks_count,
          (SELECT coalesce(sum(buyback_amount), 0)::text FROM buybacks WHERE paid_at >= ${startIso} AND paid_at <= ${endIso}) as buybacks_total,
          (SELECT coalesce(sum(net_price - paid_total), 0)::text FROM bookings WHERE status = 'ACTIVE') as receivables_total,
          (SELECT count(*)::int FROM installments INNER JOIN bookings ON installments.booking_id = bookings.id
           WHERE bookings.status = 'ACTIVE' AND installments.status IN ('PENDING', 'PARTIAL', 'OVERDUE')
             AND installments.paid_amount < installments.amount AND installments.due_date <= ${nowIso}) as overdue_count,
          (SELECT coalesce(sum(installments.amount - installments.paid_amount), 0)::text FROM installments INNER JOIN bookings ON installments.booking_id = bookings.id
           WHERE bookings.status = 'ACTIVE' AND installments.status IN ('PENDING', 'PARTIAL', 'OVERDUE')
             AND installments.paid_amount < installments.amount AND installments.due_date <= ${nowIso}) as overdue_total,
          (SELECT count(*)::int FROM bookings WHERE created_at >= ${startIso} AND created_at <= ${endIso} AND discount_value > 0) as discounts_count,
          (SELECT coalesce(sum(discount_value), 0)::text FROM bookings WHERE created_at >= ${startIso} AND created_at <= ${endIso} AND discount_value > 0) as discounts_total
      `,

      // 3. Monthly collections (past 12 months for chart)
      db
        .select({
          monthKey: sql<string>`to_char(${payments.paidAt}, 'YYYY-MM')`,
          total: sql<string>`coalesce(sum(${payments.amount}), 0)::text`,
        })
        .from(payments)
        .where(and(eq(payments.isVoided, false), gte(payments.paidAt, twelveMonthsAgo)))
        .groupBy(sql`to_char(${payments.paidAt}, 'YYYY-MM')`)
        .orderBy(sql`to_char(${payments.paidAt}, 'YYYY-MM')`),

      // 4. Breakdown by floor (without view join)
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

      // 5. Breakdown by category (without view join)
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

  const salesValuePkr = metricsRow?.sales_total || "0.00";
  const salesCount = Number(metricsRow?.sales_count || 0);

  const grossCollectedPaisa = parseDecimal(metricsRow?.payments_total || "0");
  const refundsPaisa = parseDecimal(metricsRow?.refunds_total || "0");
  const refundsCount = Number(metricsRow?.refunds_count || 0);
  const buybacksPaisa = parseDecimal(metricsRow?.buybacks_total || "0");
  const buybacksCount = Number(metricsRow?.buybacks_count || 0);

  const netCollectedPaisa = grossCollectedPaisa - refundsPaisa - buybacksPaisa;
  const outstandingReceivablesPkr = metricsRow?.receivables_total || "0.00";
  const overdueAmountPkr = metricsRow?.overdue_total || "0.00";
  const overdueCount = Number(metricsRow?.overdue_count || 0);
  const discountsGivenPkr = metricsRow?.discounts_total || "0.00";
  const discountsCount = Number(metricsRow?.discounts_count || 0);

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

  return {
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
      clientName: clients.fullName,
      clientCnic: clients.cnic,
      salePrice: sales.salePrice,
      soldDate: sales.soldAt,
      saleStatus: sales.status,
      bookingId: sales.bookingId,
      bookingListPrice: bookings.listPrice,
      bookingDiscount: bookings.discountValue,
      unitAskingPrice: sql<string>`coalesce(round((${units.ratePerSqftPkr} * ${units.netAreaSqft}) + coalesce(${units.priceAdjustmentPkr}, 0), 0)::numeric(14, 2), '0.00')`,
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

export interface ClientLedgerReportData {
  client: {
    id: string;
    fullName: string;
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
    relationType: "RESERVED" | "BOOKED" | "SOLD" | "RETURNED" | "BOUGHT_BACK";
    date: Date;
    amountPkr: string;
  }>;
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

  const [kin] = await db
    .select()
    .from(nextOfKin)
    .where(eq(nextOfKin.clientId, client.id))
    .limit(1);

  const { startDate, endDate } = resolvePresetDates(
    filters.preset,
    filters.startDate,
    filters.endDate,
  );

  // 1. Fetch client units
  const associatedUnits: ClientLedgerReportData["units"] = [];

  // Bookings
  const clientBookings = await db
    .select({
      id: bookings.id,
      unitId: units.id,
      unitCode: units.unitCode,
      floorName: floors.name,
      netPrice: bookings.netPrice,
      status: bookings.status,
      createdAt: bookings.createdAt,
    })
    .from(bookings)
    .innerJoin(units, eq(bookings.unitId, units.id))
    .innerJoin(floors, eq(units.floorId, floors.id))
    .where(eq(bookings.clientId, client.id));

  for (const b of clientBookings) {
    associatedUnits.push({
      unitId: b.unitId,
      unitCode: b.unitCode,
      floorName: b.floorName,
      relationType: b.status === "RETURNED" ? "RETURNED" : "BOOKED",
      date: b.createdAt,
      amountPkr: b.netPrice,
    });
  }

  // Sales (direct or completed bookings)
  const clientSales = await db
    .select({
      id: sales.id,
      unitId: units.id,
      unitCode: units.unitCode,
      floorName: floors.name,
      salePrice: sales.salePrice,
      status: sales.status,
      soldAt: sales.soldAt,
    })
    .from(sales)
    .innerJoin(units, eq(sales.unitId, units.id))
    .innerJoin(floors, eq(units.floorId, floors.id))
    .where(eq(sales.clientId, client.id));

  for (const s of clientSales) {
    associatedUnits.push({
      unitId: s.unitId,
      unitCode: s.unitCode,
      floorName: s.floorName,
      relationType: s.status === "BOUGHT_BACK" ? "BOUGHT_BACK" : "SOLD",
      date: s.soldAt,
      amountPkr: s.salePrice,
    });
  }

  // Active reservations
  const clientReservations = await db
    .select({
      id: reservations.id,
      unitId: units.id,
      unitCode: units.unitCode,
      floorName: floors.name,
      startAt: reservations.startAt,
    })
    .from(reservations)
    .innerJoin(units, eq(reservations.unitId, units.id))
    .innerJoin(floors, eq(units.floorId, floors.id))
    .where(and(eq(reservations.clientId, client.id), eq(reservations.status, "ACTIVE")));

  for (const r of clientReservations) {
    associatedUnits.push({
      unitId: r.unitId,
      unitCode: r.unitCode,
      floorName: r.floorName,
      relationType: "RESERVED",
      date: r.startAt,
      amountPkr: "0.00",
    });
  }

  // 2. Build Raw Ledger Entries for all time
  const rawEntries: LedgerRawEntry[] = [];

  // Debits: Bookings (contract price owed)
  for (const b of clientBookings) {
    rawEntries.push({
      date: b.createdAt,
      description: `Booking Contract #${b.id.slice(0, 8).toUpperCase()} (Unit ${b.unitCode})`,
      receiptNo: null,
      debitPkr: b.netPrice,
      creditPkr: "0.00",
    });
  }

  // Direct Sales (if any without booking)
  for (const s of clientSales) {
    // Check if linked to a booking (if linked, booking already debited the contract value)
    const [saleRow] = await db
      .select({ bookingId: sales.bookingId })
      .from(sales)
      .where(eq(sales.id, s.id));

    if (!saleRow?.bookingId) {
      rawEntries.push({
        date: s.soldAt,
        description: `Direct Sale (Unit ${s.unitCode})`,
        receiptNo: null,
        debitPkr: s.salePrice,
        creditPkr: "0.00",
      });
    }
  }

  // Credits: Payments made by this client
  const clientPayments = await db
    .select({
      id: payments.id,
      receiptNo: payments.receiptNo,
      amount: payments.amount,
      paidAt: payments.paidAt,
      notes: payments.notes,
      isVoided: payments.isVoided,
      bookingNo: bookings.bookingNo,
      unitCode: units.unitCode,
    })
    .from(payments)
    .innerJoin(bookings, eq(payments.bookingId, bookings.id))
    .innerJoin(units, eq(bookings.unitId, units.id))
    .where(and(eq(bookings.clientId, client.id), eq(payments.isVoided, false)));

  for (const p of clientPayments) {
    rawEntries.push({
      date: p.paidAt,
      description: `Payment Receipt (Booking ${p.bookingNo}, Unit ${p.unitCode})`,
      receiptNo: p.receiptNo,
      debitPkr: "0.00",
      creditPkr: p.amount,
    });
  }

  // Refunds
  const clientRefunds = await db
    .select({
      id: refunds.id,
      refundAmount: refunds.refundAmount,
      deduction: refunds.deduction,
      paidAt: refunds.paidAt,
      bookingId: refunds.bookingId,
    })
    .from(refunds)
    .where(eq(refunds.clientId, client.id));

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
  const clientBuybacks = await db
    .select({
      id: buybacks.id,
      buybackAmount: buybacks.buybackAmount,
      paidAt: buybacks.paidAt,
      reason: buybacks.reason,
    })
    .from(buybacks)
    .where(eq(buybacks.clientId, client.id));

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
      fullName: client.fullName,
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
    statement: {
      period: {
        startDate: startDate.toISOString().split("T")[0]!,
        endDate: endDate.toISOString().split("T")[0]!,
      },
      openingBalancePkr: statement.openingBalancePkr,
      closingBalancePkr: statement.closingBalancePkr,
      totalDebitsPkr: statement.totalDebitsPkr,
      totalCreditsPkr: statement.totalCreditsPkr,
      entries: statement.entries,
    },
  };
}
