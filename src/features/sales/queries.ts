/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import "server-only";

import { and, asc, desc, eq, ilike, inArray, isNull, lte, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { blocks, categories, floors, properties } from "@/db/schema/property";
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
import { units, unitStatusHistory } from "@/db/schema/units";
import { computeTotalPrice, formatDecimal, parseDecimal } from "@/lib/money";

export async function getSelectableUnits(params: {
  floorId?: string;
  categoryId?: string;
  clientId?: string;
}) {
  const now = new Date();
  const conditions = [isNull(units.archivedAt), eq(units.isSellable, true)];

  if (params.floorId) {
    conditions.push(eq(units.floorId, params.floorId));
  }
  if (params.categoryId) {
    conditions.push(eq(units.categoryId, params.categoryId));
  }

  // Get active reservations that have not expired
  const activeReservations = await db
    .select({
      unitId: reservations.unitId,
      clientId: reservations.clientId,
      expiresAt: reservations.expiresAt,
    })
    .from(reservations)
    .where(eq(reservations.status, "ACTIVE"));

  const validReservedUnitIds = new Set(
    activeReservations
      .filter(
        (r) => r.expiresAt > now && (!params.clientId || r.clientId !== params.clientId),
      )
      .map((r) => r.unitId),
  );

  const rows = await db
    .select({
      id: units.id,
      unitCode: units.unitCode,
      unitNumber: units.unitNumber,
      floorId: units.floorId,
      floorName: floors.name,
      floorLevel: floors.level,
      blockId: blocks.id,
      blockName: blocks.name,
      categoryId: units.categoryId,
      categoryName: categories.name,
      netAreaSqft: units.netAreaSqft,
      grossAreaSqft: units.grossAreaSqft,
      ratePerSqftPkr: units.ratePerSqftPkr,
      priceAdjustmentPkr: units.priceAdjustmentPkr,
      computedPricePkr: sql<string>`round((${units.ratePerSqftPkr} * ${units.netAreaSqft}) + coalesce(${units.priceAdjustmentPkr}, 0), 0)::numeric(14, 2)`,
      status: units.status,
      version: units.version,
    })
    .from(units)
    .innerJoin(floors, eq(units.floorId, floors.id))
    .innerJoin(blocks, eq(floors.blockId, blocks.id))
    .innerJoin(categories, eq(units.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(asc(floors.level), asc(units.unitNumber));

  // Filter: either AVAILABLE or RESERVED by current client (and not actively reserved by someone else)
  return rows.filter((r) => {
    if (validReservedUnitIds.has(r.id)) {
      return false;
    }
    if (r.status === "AVAILABLE") {
      return true;
    }
    if (r.status === "RESERVED" && params.clientId) {
      const match = activeReservations.find((res) => res.unitId === r.id);
      return match && match.clientId === params.clientId;
    }
    return false;
  });
}

export async function listBookings(filters?: { status?: string; q?: string }) {
  const conditions = [];

  if (filters?.status && filters.status !== "ALL") {
    conditions.push(eq(bookings.status, filters.status as any));
  }

  if (filters?.q && filters.q.trim()) {
    const term = `%${filters.q.trim()}%`;
    conditions.push(
      or(
        ilike(bookings.bookingNo, term),
        ilike(units.unitCode, term),
        ilike(clients.fullName, term),
        ilike(clients.cnic, term),
        ilike(clients.phone, term),
      ),
    );
  }

  const rows = await db
    .select({
      id: bookings.id,
      bookingNo: bookings.bookingNo,
      status: bookings.status,
      listPrice: bookings.listPrice,
      netPrice: bookings.netPrice,
      downPayment: bookings.downPayment,
      paidTotal: bookings.paidTotal,
      plan: bookings.plan,
      installmentCount: bookings.installmentCount,
      startDate: bookings.startDate,
      createdAt: bookings.createdAt,
      unitId: units.id,
      unitCode: units.unitCode,
      unitVersion: units.version,
      floorName: floors.name,
      blockName: blocks.name,
      clientId: clients.id,
      clientName: clients.fullName,
      clientPhone: clients.phone,
      clientCnic: clients.cnic,
    })
    .from(bookings)
    .innerJoin(units, eq(bookings.unitId, units.id))
    .innerJoin(floors, eq(units.floorId, floors.id))
    .innerJoin(blocks, eq(floors.blockId, blocks.id))
    .innerJoin(clients, eq(bookings.clientId, clients.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(bookings.createdAt));

  // Calculate KPIs across all bookings (unfiltered by search for summary cards)
  const allRows = await db
    .select({
      status: bookings.status,
      netPrice: bookings.netPrice,
      paidTotal: bookings.paidTotal,
    })
    .from(bookings);

  let activeBookings = 0;
  let collectedPaisa = 0n;
  let outstandingPaisa = 0n;

  for (const b of allRows) {
    if (b.status === "ACTIVE") {
      activeBookings++;
      const netP = parseDecimal(b.netPrice);
      const paidP = parseDecimal(b.paidTotal);
      collectedPaisa += paidP;
      const rem = netP - paidP;
      if (rem > 0n) {
        outstandingPaisa += rem;
      }
    } else if (b.status === "COMPLETED") {
      collectedPaisa += parseDecimal(b.paidTotal);
    }
  }

  // Calculate overdue amount across all active installments
  const now = new Date();
  const overdueRows = await db
    .select({
      amount: installments.amount,
      paidAmount: installments.paidAmount,
    })
    .from(installments)
    .innerJoin(bookings, eq(installments.bookingId, bookings.id))
    .where(
      and(
        eq(bookings.status, "ACTIVE"),
        lte(installments.dueDate, now),
        sql`${installments.paidAmount} < ${installments.amount}`,
      ),
    );

  let overduePaisa = 0n;
  for (const row of overdueRows) {
    const due = parseDecimal(row.amount);
    const paid = parseDecimal(row.paidAmount);
    overduePaisa += due - paid;
  }

  return {
    rows: rows.map((r) => {
      const net = parseDecimal(r.netPrice);
      const paid = parseDecimal(r.paidTotal);
      const paidPercent =
        net > 0n ? Math.min(100, Math.round(Number((paid * 10_000n) / net) / 100)) : 0;
      return {
        ...r,
        paidPercent,
      };
    }),
    kpi: {
      activeBookings,
      collectedPkr: formatDecimal(collectedPaisa),
      outstandingPkr: formatDecimal(outstandingPaisa),
      overduePkr: formatDecimal(overduePaisa),
    },
  };
}

export async function getBookingDetail(id: string) {
  const [booking] = await db
    .select({
      id: bookings.id,
      bookingNo: bookings.bookingNo,
      status: bookings.status,
      listPrice: bookings.listPrice,
      discountType: bookings.discountType,
      discountValue: bookings.discountValue,
      discountReason: bookings.discountReason,
      netPrice: bookings.netPrice,
      downPayment: bookings.downPayment,
      possessionAmount: bookings.possessionAmount,
      plan: bookings.plan,
      installmentCount: bookings.installmentCount,
      startDate: bookings.startDate,
      paidTotal: bookings.paidTotal,
      createdAt: bookings.createdAt,
      createdByName: user.name,
      unitId: units.id,
      unitCode: units.unitCode,
      unitNumber: units.unitNumber,
      unitStatus: units.status,
      unitVersion: units.version,
      netAreaSqft: units.netAreaSqft,
      grossAreaSqft: units.grossAreaSqft,
      ratePerSqftPkr: units.ratePerSqftPkr,
      priceAdjustmentPkr: units.priceAdjustmentPkr,
      floorName: floors.name,
      floorLevel: floors.level,
      blockName: blocks.name,
      categoryName: categories.name,
      clientId: clients.id,
      clientName: clients.fullName,
      clientCnic: clients.cnic,
      clientPhone: clients.phone,
      clientEmail: clients.email,
      homeAddress: clients.homeAddress,
      postalAddress: clients.postalAddress,
    })
    .from(bookings)
    .innerJoin(units, eq(bookings.unitId, units.id))
    .innerJoin(floors, eq(units.floorId, floors.id))
    .innerJoin(blocks, eq(floors.blockId, blocks.id))
    .innerJoin(categories, eq(units.categoryId, categories.id))
    .innerJoin(clients, eq(bookings.clientId, clients.id))
    .leftJoin(user, eq(bookings.createdBy, user.id))
    .where(eq(bookings.id, id))
    .limit(1);

  if (!booking) return null;

  const [kin] = await db
    .select()
    .from(nextOfKin)
    .where(eq(nextOfKin.clientId, booking.clientId))
    .limit(1);

  const installmentRows = await db
    .select()
    .from(installments)
    .where(eq(installments.bookingId, booking.id))
    .orderBy(asc(installments.seq));

  const paymentRows = await db
    .select({
      id: payments.id,
      receiptNo: payments.receiptNo,
      amount: payments.amount,
      method: payments.method,
      chequeNo: payments.chequeNo,
      bank: payments.bank,
      paidAt: payments.paidAt,
      notes: payments.notes,
      receivedByName: user.name,
      createdAt: payments.createdAt,
    })
    .from(payments)
    .leftJoin(user, eq(payments.receivedBy, user.id))
    .where(eq(payments.bookingId, booking.id))
    .orderBy(desc(payments.paidAt));

  const refundRows = await db
    .select({
      id: refunds.id,
      paidTotal: refunds.paidTotal,
      deduction: refunds.deduction,
      refundAmount: refunds.refundAmount,
      method: refunds.method,
      chequeNo: refunds.chequeNo,
      bank: refunds.bank,
      reason: refunds.reason,
      paidAt: refunds.paidAt,
      approvedByName: user.name,
      createdAt: refunds.createdAt,
    })
    .from(refunds)
    .leftJoin(user, eq(refunds.approvedBy, user.id))
    .where(eq(refunds.bookingId, booking.id))
    .orderBy(desc(refunds.createdAt));

  const now = new Date();
  const schedule = installmentRows.map((inst) => {
    const isPastDue = inst.dueDate < now;
    const isUnpaid = parseDecimal(inst.paidAmount) < parseDecimal(inst.amount);
    const computedStatus =
      inst.status === "PENDING" && isPastDue && isUnpaid ? "OVERDUE" : inst.status;

    return {
      ...inst,
      status: computedStatus,
    };
  });

  const netP = parseDecimal(booking.netPrice);
  const paidP = parseDecimal(booking.paidTotal);
  const paidPercent =
    netP > 0n ? Math.min(100, Math.round(Number((paidP * 10_000n) / netP) / 100)) : 0;
  const remainingPaisa = netP - paidP;

  return {
    booking: {
      ...booking,
      paidPercent,
      remainingBalancePkr: formatDecimal(remainingPaisa > 0n ? remainingPaisa : 0n),
    },
    nextOfKin: kin ?? null,
    installments: schedule,
    payments: paymentRows,
    refunds: refundRows,
  };
}

export async function listReservations(filters?: { status?: string; q?: string }) {
  const conditions = [];

  if (filters?.status && filters.status !== "ALL") {
    conditions.push(eq(reservations.status, filters.status as any));
  }

  if (filters?.q && filters.q.trim()) {
    const term = `%${filters.q.trim()}%`;
    conditions.push(
      or(
        ilike(units.unitCode, term),
        ilike(clients.fullName, term),
        ilike(clients.cnic, term),
        ilike(clients.phone, term),
      ),
    );
  }

  const rows = await db
    .select({
      id: reservations.id,
      status: reservations.status,
      startAt: reservations.startAt,
      expiresAt: reservations.expiresAt,
      durationDays: reservations.durationDays,
      notes: reservations.notes,
      createdAt: reservations.createdAt,
      unitId: units.id,
      unitCode: units.unitCode,
      unitVersion: units.version,
      floorName: floors.name,
      blockName: blocks.name,
      clientId: clients.id,
      clientName: clients.fullName,
      clientPhone: clients.phone,
      clientCnic: clients.cnic,
      createdByName: user.name,
    })
    .from(reservations)
    .innerJoin(units, eq(reservations.unitId, units.id))
    .innerJoin(floors, eq(units.floorId, floors.id))
    .innerJoin(blocks, eq(floors.blockId, blocks.id))
    .innerJoin(clients, eq(reservations.clientId, clients.id))
    .leftJoin(user, eq(reservations.createdBy, user.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(reservations.createdAt));

  const allReservations = await db.select().from(reservations);
  const now = new Date();
  let activeCount = 0;
  let expiringSoonCount = 0;
  let convertedCount = 0;
  let cancelledCount = 0;

  for (const r of allReservations) {
    if (r.status === "ACTIVE") {
      activeCount++;
      const msLeft = r.expiresAt.getTime() - now.getTime();
      if (msLeft > 0 && msLeft < 24 * 60 * 60 * 1000) {
        expiringSoonCount++;
      }
    } else if (r.status === "CONVERTED") {
      convertedCount++;
    } else if (r.status === "CANCELLED") {
      cancelledCount++;
    }
  }

  return {
    rows,
    kpi: {
      activeCount,
      expiringSoonCount,
      convertedCount,
      cancelledCount,
    },
  };
}

export async function getReservationDetail(id: string) {
  const [res] = await db
    .select({
      id: reservations.id,
      status: reservations.status,
      startAt: reservations.startAt,
      expiresAt: reservations.expiresAt,
      durationDays: reservations.durationDays,
      notes: reservations.notes,
      cancelledAt: reservations.cancelledAt,
      cancelledReason: reservations.cancelledReason,
      createdAt: reservations.createdAt,
      createdByName: user.name,
      unitId: units.id,
      unitCode: units.unitCode,
      unitNumber: units.unitNumber,
      unitStatus: units.status,
      unitVersion: units.version,
      netAreaSqft: units.netAreaSqft,
      ratePerSqftPkr: units.ratePerSqftPkr,
      computedPricePkr: sql<string>`round((${units.ratePerSqftPkr} * ${units.netAreaSqft}) + coalesce(${units.priceAdjustmentPkr}, 0), 0)::numeric(14, 2)`,
      floorName: floors.name,
      floorLevel: floors.level,
      blockName: blocks.name,
      categoryName: categories.name,
      clientId: clients.id,
      clientName: clients.fullName,
      clientCnic: clients.cnic,
      clientPhone: clients.phone,
      clientEmail: clients.email,
      homeAddress: clients.homeAddress,
      postalAddress: clients.postalAddress,
    })
    .from(reservations)
    .innerJoin(units, eq(reservations.unitId, units.id))
    .innerJoin(floors, eq(units.floorId, floors.id))
    .innerJoin(blocks, eq(floors.blockId, blocks.id))
    .innerJoin(categories, eq(units.categoryId, categories.id))
    .innerJoin(clients, eq(reservations.clientId, clients.id))
    .leftJoin(user, eq(reservations.createdBy, user.id))
    .where(eq(reservations.id, id))
    .limit(1);

  if (!res) return null;

  const [kin] = await db
    .select()
    .from(nextOfKin)
    .where(eq(nextOfKin.clientId, res.clientId))
    .limit(1);

  return {
    reservation: res,
    nextOfKin: kin ?? null,
  };
}

export async function listSoldUnits(filters?: { q?: string }) {
  // Query sales records (both direct sales and completed bookings with sales records)
  const directSalesQuery = db
    .select({
      id: sales.id,
      saleType:
        sql<string>`case when ${sales.bookingId} is not null then 'COMPLETED_BOOKING' else 'DIRECT_SALE' end`.as(
          "sale_type",
        ),
      unitId: units.id,
      unitCode: units.unitCode,
      unitNumber: units.unitNumber,
      floorName: floors.name,
      blockName: blocks.name,
      categoryName: categories.name,
      clientId: clients.id,
      clientName: clients.fullName,
      clientPhone: clients.phone,
      clientCnic: clients.cnic,
      pricePkr: sales.salePrice,
      soldAt: sales.soldAt,
      status: sales.status,
      bookingNo: bookings.bookingNo,
      bookingId: sales.bookingId,
    })
    .from(sales)
    .innerJoin(units, eq(sales.unitId, units.id))
    .innerJoin(floors, eq(units.floorId, floors.id))
    .innerJoin(blocks, eq(floors.blockId, blocks.id))
    .innerJoin(categories, eq(units.categoryId, categories.id))
    .innerJoin(clients, eq(sales.clientId, clients.id))
    .leftJoin(bookings, eq(sales.bookingId, bookings.id));

  // Query completed bookings that do NOT already have a sales record
  const completedBookingsQuery = db
    .select({
      id: bookings.id,
      saleType: sql<string>`'COMPLETED_BOOKING'`.as("sale_type"),
      unitId: units.id,
      unitCode: units.unitCode,
      unitNumber: units.unitNumber,
      floorName: floors.name,
      blockName: blocks.name,
      categoryName: categories.name,
      clientId: clients.id,
      clientName: clients.fullName,
      clientPhone: clients.phone,
      clientCnic: clients.cnic,
      pricePkr: bookings.netPrice,
      soldAt: bookings.updatedAt,
      status: sql<string>`'ACTIVE'`.as("status"),
      bookingNo: bookings.bookingNo,
      bookingId: bookings.id,
    })
    .from(bookings)
    .innerJoin(units, eq(bookings.unitId, units.id))
    .innerJoin(floors, eq(units.floorId, floors.id))
    .innerJoin(blocks, eq(floors.blockId, blocks.id))
    .innerJoin(categories, eq(units.categoryId, categories.id))
    .innerJoin(clients, eq(bookings.clientId, clients.id))
    .where(
      and(
        eq(bookings.status, "COMPLETED"),
        sql`not exists (select 1 from "sales" where "sales"."booking_id" = "bookings"."id")`,
      ),
    );

  const [directRows, completedRows] = await Promise.all([
    directSalesQuery,
    completedBookingsQuery,
  ]);

  let allSold = [...directRows, ...completedRows].sort(
    (a, b) => b.soldAt.getTime() - a.soldAt.getTime(),
  );

  if (filters?.q && filters.q.trim()) {
    const term = filters.q.trim().toLowerCase();
    allSold = allSold.filter(
      (r) =>
        r.unitCode.toLowerCase().includes(term) ||
        r.clientName.toLowerCase().includes(term) ||
        r.clientCnic.toLowerCase().includes(term) ||
        r.clientPhone.toLowerCase().includes(term) ||
        (r.bookingNo && r.bookingNo.toLowerCase().includes(term)),
    );
  }

  let totalVolumePaisa = 0n;
  let activeSoldCount = 0;
  for (const s of allSold) {
    if (s.status === "ACTIVE") {
      activeSoldCount++;
      totalVolumePaisa += parseDecimal(s.pricePkr);
    }
  }

  const avgPricePkr =
    activeSoldCount > 0
      ? formatDecimal(totalVolumePaisa / BigInt(activeSoldCount))
      : "0.00";

  return {
    rows: allSold,
    kpi: {
      totalSold: activeSoldCount,
      totalVolumePkr: formatDecimal(totalVolumePaisa),
      avgPricePkr,
    },
  };
}

export async function getSoldDetail(id: string) {
  // Check if direct sale first
  const [sale] = await db
    .select({
      id: sales.id,
      unitId: sales.unitId,
      clientId: sales.clientId,
      bookingId: sales.bookingId,
      salePrice: sales.salePrice,
      soldAt: sales.soldAt,
      notes: sales.notes,
      status: sales.status,
      createdByName: user.name,
      createdAt: sales.createdAt,
      unitCode: units.unitCode,
      unitNumber: units.unitNumber,
      unitStatus: units.status,
      unitVersion: units.version,
      netAreaSqft: units.netAreaSqft,
      ratePerSqftPkr: units.ratePerSqftPkr,
      priceAdjustmentPkr: units.priceAdjustmentPkr,
      floorName: floors.name,
      floorLevel: floors.level,
      blockName: blocks.name,
      categoryName: categories.name,
      clientName: clients.fullName,
      clientCnic: clients.cnic,
      clientPhone: clients.phone,
      clientEmail: clients.email,
      homeAddress: clients.homeAddress,
      postalAddress: clients.postalAddress,
    })
    .from(sales)
    .innerJoin(units, eq(sales.unitId, units.id))
    .innerJoin(floors, eq(units.floorId, floors.id))
    .innerJoin(blocks, eq(floors.blockId, blocks.id))
    .innerJoin(categories, eq(units.categoryId, categories.id))
    .innerJoin(clients, eq(sales.clientId, clients.id))
    .leftJoin(user, eq(sales.createdBy, user.id))
    .where(eq(sales.id, id))
    .limit(1);

  if (sale) {
    const [buyback] = await db
      .select({
        id: buybacks.id,
        buybackAmount: buybacks.buybackAmount,
        originalPrice: buybacks.originalPrice,
        method: buybacks.method,
        chequeNo: buybacks.chequeNo,
        bank: buybacks.bank,
        reason: buybacks.reason,
        paidAt: buybacks.paidAt,
        approvedByName: user.name,
        createdAt: buybacks.createdAt,
      })
      .from(buybacks)
      .leftJoin(user, eq(buybacks.approvedBy, user.id))
      .where(eq(buybacks.saleId, sale.id))
      .limit(1);

    return {
      type: "DIRECT_SALE" as const,
      data: sale,
      buyback: buyback ?? null,
    };
  }

  // Otherwise check completed booking
  const bookingDetail = await getBookingDetail(id);
  if (bookingDetail) {
    const [buyback] = await db
      .select({
        id: buybacks.id,
        buybackAmount: buybacks.buybackAmount,
        originalPrice: buybacks.originalPrice,
        method: buybacks.method,
        chequeNo: buybacks.chequeNo,
        bank: buybacks.bank,
        reason: buybacks.reason,
        paidAt: buybacks.paidAt,
        approvedByName: user.name,
        createdAt: buybacks.createdAt,
      })
      .from(buybacks)
      .leftJoin(user, eq(buybacks.approvedBy, user.id))
      .where(eq(buybacks.bookingId, bookingDetail.booking.id))
      .limit(1);

    return {
      type: "COMPLETED_BOOKING" as const,
      data: bookingDetail,
      buyback: buyback ?? null,
    };
  }

  return null;
}

export interface UnitTimelineEvent {
  id: string;
  type:
    | "RESERVATION"
    | "BOOKING"
    | "PAYMENT"
    | "SALE"
    | "BUYBACK"
    | "REFUND"
    | "STATUS_CHANGE";
  title: string;
  date: Date;
  amountPkr?: string;
  actorName?: string;
  details?: Record<string, unknown>;
  badgeTone: "available" | "accent" | "primary" | "sold" | "muted";
}

export async function getUnitOwnershipTimeline(
  unitId: string,
): Promise<UnitTimelineEvent[]> {
  const events: UnitTimelineEvent[] = [];

  const [resRows, bRows, sRows, bbRows] = await Promise.all([
    // Reservations
    db
      .select({
        id: reservations.id,
        status: reservations.status,
        startAt: reservations.startAt,
        expiresAt: reservations.expiresAt,
        clientName: clients.fullName,
        actorName: user.name,
      })
      .from(reservations)
      .innerJoin(clients, eq(reservations.clientId, clients.id))
      .leftJoin(user, eq(reservations.createdBy, user.id))
      .where(eq(reservations.unitId, unitId)),

    // Bookings
    db
      .select({
        id: bookings.id,
        bookingNo: bookings.bookingNo,
        netPrice: bookings.netPrice,
        status: bookings.status,
        createdAt: bookings.createdAt,
        clientName: clients.fullName,
        actorName: user.name,
      })
      .from(bookings)
      .innerJoin(clients, eq(bookings.clientId, clients.id))
      .leftJoin(user, eq(bookings.createdBy, user.id))
      .where(eq(bookings.unitId, unitId)),

    // Direct sales
    db
      .select({
        id: sales.id,
        salePrice: sales.salePrice,
        soldAt: sales.soldAt,
        status: sales.status,
        clientName: clients.fullName,
        actorName: user.name,
      })
      .from(sales)
      .innerJoin(clients, eq(sales.clientId, clients.id))
      .leftJoin(user, eq(sales.createdBy, user.id))
      .where(eq(sales.unitId, unitId)),

    // Buybacks
    db
      .select({
        id: buybacks.id,
        buybackAmount: buybacks.buybackAmount,
        originalPrice: buybacks.originalPrice,
        reason: buybacks.reason,
        paidAt: buybacks.paidAt,
        clientName: clients.fullName,
        actorName: user.name,
      })
      .from(buybacks)
      .innerJoin(clients, eq(buybacks.clientId, clients.id))
      .leftJoin(user, eq(buybacks.approvedBy, user.id))
      .where(eq(buybacks.unitId, unitId)),
  ]);

  for (const r of resRows) {
    events.push({
      id: `res-${r.id}`,
      type: "RESERVATION",
      title: `Reserved by ${r.clientName} (${r.status})`,
      date: r.startAt,
      actorName: r.actorName ?? undefined,
      badgeTone: "accent",
      details: { status: r.status, expiresAt: r.expiresAt },
    });
  }

  for (const b of bRows) {
    events.push({
      id: `bk-${b.id}`,
      type: "BOOKING",
      title: `Booked by ${b.clientName} (${b.bookingNo})`,
      date: b.createdAt,
      amountPkr: b.netPrice,
      actorName: b.actorName ?? undefined,
      badgeTone: "primary",
      details: { bookingNo: b.bookingNo, status: b.status },
    });

    // Payments for this booking
    const pRows = await db
      .select({
        id: payments.id,
        receiptNo: payments.receiptNo,
        amount: payments.amount,
        method: payments.method,
        paidAt: payments.paidAt,
        actorName: user.name,
      })
      .from(payments)
      .leftJoin(user, eq(payments.receivedBy, user.id))
      .where(eq(payments.bookingId, b.id));

    for (const p of pRows) {
      events.push({
        id: `pay-${p.id}`,
        type: "PAYMENT",
        title: `Payment ${p.receiptNo} (${p.method})`,
        date: p.paidAt,
        amountPkr: p.amount,
        actorName: p.actorName ?? undefined,
        badgeTone: "primary",
      });
    }

    // Refunds for this booking
    const refRows = await db
      .select({
        id: refunds.id,
        refundAmount: refunds.refundAmount,
        deduction: refunds.deduction,
        reason: refunds.reason,
        paidAt: refunds.paidAt,
        actorName: user.name,
      })
      .from(refunds)
      .leftJoin(user, eq(refunds.approvedBy, user.id))
      .where(eq(refunds.bookingId, b.id));

    for (const ref of refRows) {
      events.push({
        id: `ref-${ref.id}`,
        type: "REFUND",
        title: `Booking Return Refund (Deduction: Rs ${ref.deduction})`,
        date: ref.paidAt,
        amountPkr: ref.refundAmount,
        actorName: ref.actorName ?? undefined,
        badgeTone: "muted",
        details: { reason: ref.reason },
      });
    }
  }

  for (const s of sRows) {
    events.push({
      id: `sale-${s.id}`,
      type: "SALE",
      title: `Direct Sale to ${s.clientName}`,
      date: s.soldAt,
      amountPkr: s.salePrice,
      actorName: s.actorName ?? undefined,
      badgeTone: "sold",
      details: { status: s.status },
    });
  }

  for (const bb of bbRows) {
    events.push({
      id: `bb-${bb.id}`,
      type: "BUYBACK",
      title: `Buyback from ${bb.clientName} (Orig: Rs ${bb.originalPrice})`,
      date: bb.paidAt,
      amountPkr: bb.buybackAmount,
      actorName: bb.actorName ?? undefined,
      badgeTone: "available",
      details: { reason: bb.reason },
    });
  }

  return events.sort((a, b) => b.date.getTime() - a.date.getTime());
}

export async function getMonthlyRefundsAndBuybacks() {
  const now = new Date();
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const [refundSum] = await db
    .select({
      total: sql<string>`coalesce(sum(${refunds.refundAmount}), 0)::text`,
    })
    .from(refunds)
    .where(sql`${refunds.paidAt} >= ${startOfMonth.toISOString()}`);

  const [buybackSum] = await db
    .select({
      total: sql<string>`coalesce(sum(${buybacks.buybackAmount}), 0)::text`,
    })
    .from(buybacks)
    .where(sql`${buybacks.paidAt} >= ${startOfMonth.toISOString()}`);

  const refundPaisa = parseDecimal(refundSum?.total ?? "0");
  const buybackPaisa = parseDecimal(buybackSum?.total ?? "0");
  const totalMonthReversalsPaisa = refundPaisa + buybackPaisa;

  return {
    refundsMonthPkr: formatDecimal(refundPaisa),
    buybacksMonthPkr: formatDecimal(buybackPaisa),
    totalMonthReversalsPkr: formatDecimal(totalMonthReversalsPaisa),
  };
}
