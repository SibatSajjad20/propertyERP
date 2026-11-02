/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use server";

import { and, desc, eq, isNull, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { db } from "@/db";
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
import { formatCnic } from "./schema";

export async function findClientByCnic(cnic: string) {
  const trimmed = cnic.trim();
  if (!trimmed) return null;
  const normalized = formatCnic(trimmed);

  const [client] = await db
    .select()
    .from(clients)
    .where(or(eq(clients.cnic, normalized), eq(clients.cnic, trimmed)))
    .limit(1);

  if (!client) return null;

  const [kin] = await db
    .select()
    .from(nextOfKin)
    .where(eq(nextOfKin.clientId, client.id))
    .limit(1);

  return { client, nextOfKin: kin ?? null };
}

function parseInput<T>(
  schema: z.ZodType<T>,
  input: unknown,
  defaultMessage = "Invalid input data",
): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    const issue = result.error.issues[0];
    const message = issue ? issue.message : defaultMessage;
    throw new ValidationError(message);
  }
  return result.data;
}
import { requireSession } from "@/lib/auth";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { computeTotalPrice, formatDecimal, parseDecimal } from "@/lib/money";
import { assertCan, can } from "@/lib/permissions";
import { changeUnitStatusInTx } from "@/features/units/actions";
import {
  allocatePayment,
  calculateBuyback,
  calculateDiscount,
  calculateRefund,
  generateSchedule,
  MAX_SALES_DISCOUNT_PERCENT,
} from "./calculator";
import {
  buybackSaleSchema,
  cancelReservationSchema,
  createBookingSchema,
  createDirectSaleSchema,
  createReservationSchema,
  extendReservationSchema,
  recordPaymentSchema,
  returnBookingSchema,
} from "./schema";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

function revalidateSalesPaths(unitId?: string, bookingId?: string) {
  revalidatePath("/inventory");
  revalidatePath("/bookings");
  revalidatePath("/reservations");
  revalidatePath("/sold");
  revalidatePath("/");
  if (unitId) revalidatePath(`/units/${unitId}`);
  if (bookingId) revalidatePath(`/bookings/${bookingId}`);
}

async function upsertClientAndKin(
  tx: Tx,
  clientData: {
    fullName: string;
    cnic: string;
    phone: string;
    email?: string | null;
    homeAddress: string;
    postalAddress: string;
  },
  kinData?: {
    name: string;
    relation: string;
    cnic?: string | null;
    phone: string;
    address?: string | null;
  } | null,
) {
  let [client] = await tx
    .select()
    .from(clients)
    .where(eq(clients.cnic, clientData.cnic.trim()))
    .limit(1);

  if (!client) {
    [client] = await tx
      .insert(clients)
      .values({
        fullName: clientData.fullName.trim(),
        cnic: clientData.cnic.trim(),
        phone: clientData.phone.trim(),
        email: clientData.email?.trim() || null,
        homeAddress: clientData.homeAddress.trim(),
        postalAddress: clientData.postalAddress.trim(),
      })
      .returning();
  } else {
    // Update existing client details
    [client] = await tx
      .update(clients)
      .set({
        fullName: clientData.fullName.trim(),
        phone: clientData.phone.trim(),
        email: clientData.email?.trim() || null,
        homeAddress: clientData.homeAddress.trim(),
        postalAddress: clientData.postalAddress.trim(),
        updatedAt: new Date(),
      })
      .where(eq(clients.id, client.id))
      .returning();
  }

  if (kinData && client) {
    const [existingKin] = await tx
      .select({ id: nextOfKin.id })
      .from(nextOfKin)
      .where(eq(nextOfKin.clientId, client.id))
      .limit(1);

    if (existingKin) {
      await tx
        .update(nextOfKin)
        .set({
          name: kinData.name.trim(),
          relation: kinData.relation.trim(),
          cnic: kinData.cnic?.trim() || null,
          phone: kinData.phone.trim(),
          address: kinData.address?.trim() || null,
        })
        .where(eq(nextOfKin.id, existingKin.id));
    } else {
      await tx.insert(nextOfKin).values({
        clientId: client.id,
        name: kinData.name.trim(),
        relation: kinData.relation.trim(),
        cnic: kinData.cnic?.trim() || null,
        phone: kinData.phone.trim(),
        address: kinData.address?.trim() || null,
      });
    }
  }

  if (!client) {
    throw new ValidationError("Failed to save client details");
  }

  return client;
}

async function nextBookingNumber(tx: Tx): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `SM-BK-${year}-`;
  const [row] = await tx
    .select({ count: sql<number>`count(*)::int` })
    .from(bookings)
    .where(sql`${bookings.bookingNo} LIKE ${prefix + "%"}`);

  const seq = (Number(row?.count ?? 0) + 1).toString().padStart(4, "0");
  return `${prefix}${seq}`;
}

async function nextReceiptNumber(tx: Tx): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `SM-REC-${year}-`;
  const [row] = await tx
    .select({ count: sql<number>`count(*)::int` })
    .from(payments)
    .where(sql`${payments.receiptNo} LIKE ${prefix + "%"}`);

  const seq = (Number(row?.count ?? 0) + 1).toString().padStart(4, "0");
  return `${prefix}${seq}`;
}

export async function createReservation(input: unknown) {
  const parsed = parseInput(createReservationSchema, input);
  const session = await requireSession();
  assertCan(session.user.role, "reservations.create");

  const created = await db.transaction(async (tx) => {
    const client = await upsertClientAndKin(tx, parsed.client, parsed.nextOfKin);

    const [unit] = await tx
      .select()
      .from(units)
      .where(and(eq(units.id, parsed.unitId), isNull(units.archivedAt)))
      .for("update");

    if (!unit) {
      throw new NotFoundError("Unit not found");
    }

    if (unit.status !== "AVAILABLE") {
      throw new ValidationError(
        `Unit ${unit.unitCode} is not available for reservation (current status: ${unit.status}).`,
      );
    }

    const startAt = new Date();
    let expiresAt: Date;
    if (parsed.customExpiryDate) {
      expiresAt = new Date(parsed.customExpiryDate);
      if (isNaN(expiresAt.getTime()) || expiresAt <= startAt) {
        throw new ValidationError("Custom expiry date must be in the future.");
      }
    } else {
      expiresAt = new Date(startAt.getTime() + parsed.durationDays * 24 * 60 * 60 * 1000);
    }

    // Change unit status: AVAILABLE -> RESERVED
    await changeUnitStatusInTx(
      tx,
      {
        unitId: unit.id,
        expectedVersion: unit.version,
        toStatus: "RESERVED",
        reason: `Reserved for ${client.fullName} until ${expiresAt.toISOString().slice(0, 10)}`,
        bookingRef: `RES-${unit.unitCode}`,
      },
      session.user,
    );

    const [reservation] = await tx
      .insert(reservations)
      .values({
        unitId: unit.id,
        clientId: client.id,
        startAt,
        expiresAt,
        durationDays: parsed.durationDays,
        status: "ACTIVE",
        notes: parsed.notes?.trim() || null,
        createdBy: session.user.id,
      })
      .returning();

    if (!reservation) throw new Error("Failed to create reservation");
    return reservation;
  });

  logger.info(
    { reservationId: created.id, actorId: session.user.id },
    "reservation created",
  );
  revalidateSalesPaths(parsed.unitId);
  return created;
}

export async function cancelReservation(input: unknown) {
  const parsed = parseInput(cancelReservationSchema, input);
  const session = await requireSession();
  assertCan(session.user.role, "reservations.cancel");

  const cancelled = await db.transaction(async (tx) => {
    const [res] = await tx
      .select()
      .from(reservations)
      .where(eq(reservations.id, parsed.reservationId))
      .for("update");

    if (!res) {
      throw new NotFoundError("Reservation not found");
    }

    if (res.status !== "ACTIVE") {
      throw new ValidationError(`Reservation is already ${res.status.toLowerCase()}.`);
    }

    const [unit] = await tx
      .select()
      .from(units)
      .where(eq(units.id, res.unitId))
      .for("update");

    if (!unit) {
      throw new NotFoundError("Unit not found");
    }

    // Change unit status: RESERVED -> AVAILABLE
    await changeUnitStatusInTx(
      tx,
      {
        unitId: unit.id,
        expectedVersion: unit.version,
        toStatus: "AVAILABLE",
        reason: parsed.reason,
      },
      session.user,
    );

    const [updatedRes] = await tx
      .update(reservations)
      .set({
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelledReason: parsed.reason,
        updatedAt: new Date(),
      })
      .where(eq(reservations.id, res.id))
      .returning();

    if (!updatedRes) throw new Error("Failed to cancel reservation");
    return updatedRes;
  });

  logger.info(
    { reservationId: cancelled.id, actorId: session.user.id },
    "reservation cancelled",
  );
  revalidateSalesPaths(cancelled.unitId);
  return cancelled;
}

export async function extendReservation(input: unknown) {
  const parsed = parseInput(extendReservationSchema, input);
  const session = await requireSession();
  assertCan(session.user.role, "reservations.extend");

  const [res] = await db
    .select()
    .from(reservations)
    .where(eq(reservations.id, parsed.reservationId))
    .limit(1);

  if (!res) throw new NotFoundError("Reservation not found");
  if (res.status !== "ACTIVE")
    throw new ValidationError("Can only extend active reservations.");

  const currentExpiry = new Date(res.expiresAt);
  const newExpiry = new Date(
    currentExpiry.getTime() + parsed.additionalDays * 24 * 60 * 60 * 1000,
  );

  const [updated] = await db
    .update(reservations)
    .set({
      expiresAt: newExpiry,
      durationDays: res.durationDays + parsed.additionalDays,
      updatedAt: new Date(),
    })
    .where(eq(reservations.id, res.id))
    .returning();

  if (!updated) throw new Error("Failed to extend reservation");
  logger.info(
    { reservationId: updated.id, actorId: session.user.id },
    "reservation extended",
  );
  revalidateSalesPaths(updated.unitId);
  return updated;
}

export async function createBooking(input: unknown) {
  const parsed = parseInput(createBookingSchema, input);
  const session = await requireSession();
  assertCan(session.user.role, "bookings.create");

  const created = await db.transaction(async (tx) => {
    const client = await upsertClientAndKin(tx, parsed.client, parsed.nextOfKin);

    const [unit] = await tx
      .select()
      .from(units)
      .where(and(eq(units.id, parsed.unitId), isNull(units.archivedAt)))
      .for("update");

    if (!unit) {
      throw new NotFoundError("Unit not found");
    }

    if (!unit.isSellable) {
      throw new ValidationError("This unit is not sellable.");
    }

    // Unit must be AVAILABLE or RESERVED by this client
    if (unit.status !== "AVAILABLE") {
      if (unit.status === "RESERVED") {
        const [activeRes] = await tx
          .select()
          .from(reservations)
          .where(
            and(
              eq(reservations.unitId, unit.id),
              eq(reservations.clientId, client.id),
              eq(reservations.status, "ACTIVE"),
            ),
          )
          .limit(1);

        if (!activeRes) {
          throw new ValidationError(
            `Unit is currently reserved by another client or reservation expired.`,
          );
        }
      } else {
        throw new ValidationError(`Unit is not available (status: ${unit.status}).`);
      }
    }

    const listPricePkr = computeTotalPrice(
      unit.ratePerSqftPkr,
      unit.netAreaSqft,
      unit.priceAdjustmentPkr,
    );

    // Calculate discount & enforce permissions
    const discountCalc = calculateDiscount(
      listPricePkr,
      parsed.discountType,
      parsed.discountValue,
    );

    if (discountCalc.requiresAdmin) {
      assertCan(session.user.role, "sales.large_discount");
      if (!parsed.discountReason || parsed.discountReason.trim().length === 0) {
        throw new ValidationError("A reason is required for discounts exceeding 10%.");
      }
    }

    const netPricePkr = discountCalc.netPricePkr;
    const downPaymentPaisa = parseDecimal(parsed.downPaymentPkr);
    const netPricePaisa = parseDecimal(netPricePkr);

    if (downPaymentPaisa > netPricePaisa) {
      throw new ValidationError("Down payment cannot exceed net price.");
    }

    const bookingNo = await nextBookingNumber(tx);
    const receiptNo = await nextReceiptNumber(tx);

    const schedule = generateSchedule({
      listPricePkr,
      discountType: parsed.discountType,
      discountValue: parsed.discountValue,
      downPaymentPkr: parsed.downPaymentPkr,
      possessionAmountPkr: parsed.possessionAmountPkr,
      plan: parsed.plan,
      installmentCount: parsed.installmentCount,
      startDate: new Date(parsed.startDate),
    });

    const isFullyPaid = downPaymentPaisa >= netPricePaisa;

    // Convert any existing active reservation for this unit/client
    await tx
      .update(reservations)
      .set({
        status: "CONVERTED",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(reservations.unitId, unit.id),
          eq(reservations.clientId, client.id),
          eq(reservations.status, "ACTIVE"),
        ),
      );

    // Insert booking
    const [booking] = await tx
      .insert(bookings)
      .values({
        unitId: unit.id,
        clientId: client.id,
        bookingNo,
        listPrice: listPricePkr,
        discountType: parsed.discountType || null,
        discountValue: parsed.discountValue || "0.00",
        discountReason: parsed.discountReason?.trim() || null,
        netPrice: netPricePkr,
        downPayment: parsed.downPaymentPkr,
        possessionAmount: parsed.possessionAmountPkr || "0.00",
        plan: parsed.plan,
        installmentCount: parsed.installmentCount,
        startDate: new Date(parsed.startDate),
        status: isFullyPaid ? "COMPLETED" : "ACTIVE",
        paidTotal: parsed.downPaymentPkr,
        createdBy: session.user.id,
      })
      .returning();

    if (!booking) throw new Error("Failed to create booking");

    // Insert installments
    if (schedule.installments.length > 0) {
      await tx.insert(installments).values(
        schedule.installments.map((inst) => ({
          bookingId: booking.id,
          seq: inst.seq,
          dueDate: inst.dueDate,
          amount: inst.amountPkr,
          paidAmount: "0.00",
          status: "PENDING" as const,
        })),
      );
    }

    // Insert first payment (down payment receipt)
    await tx.insert(payments).values({
      bookingId: booking.id,
      receiptNo,
      amount: parsed.downPaymentPkr,
      method: parsed.paymentMethod,
      chequeNo: parsed.chequeNo?.trim() || null,
      bank: parsed.bank?.trim() || null,
      paidAt: new Date(),
      notes: parsed.notes?.trim() || "Down payment on booking",
      receivedBy: session.user.id,
    });

    // Unit status transition
    if (isFullyPaid) {
      // Auto SOLD when paid 100%
      await changeUnitStatusInTx(
        tx,
        {
          unitId: unit.id,
          expectedVersion: unit.version,
          toStatus: "SOLD",
          bookingRef: bookingNo,
          soldPricePkr: netPricePkr,
          reason: `100% paid on booking (${bookingNo})`,
        },
        session.user,
      );

      // Create sales record
      await tx.insert(sales).values({
        unitId: unit.id,
        clientId: client.id,
        bookingId: booking.id,
        salePrice: netPricePkr,
        soldAt: new Date(),
        notes: `Completed booking ${bookingNo}`,
        status: "ACTIVE",
        createdBy: session.user.id,
      });
    } else {
      // Unit -> BOOKED
      await changeUnitStatusInTx(
        tx,
        {
          unitId: unit.id,
          expectedVersion: unit.version,
          toStatus: "BOOKED",
          bookingRef: bookingNo,
          reason: `Booked under ${bookingNo}`,
        },
        session.user,
      );
    }

    return booking;
  });

  logger.info({ bookingId: created.id, actorId: session.user.id }, "booking created");
  revalidateSalesPaths(parsed.unitId, created.id);
  return created;
}

export async function recordPayment(input: unknown) {
  const parsed = parseInput(recordPaymentSchema, input);
  const session = await requireSession();
  assertCan(session.user.role, "payments.create");

  const recorded = await db.transaction(async (tx) => {
    const [booking] = await tx
      .select()
      .from(bookings)
      .where(eq(bookings.id, parsed.bookingId))
      .for("update");

    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    if (booking.status !== "ACTIVE") {
      throw new ValidationError(
        `Cannot record payments on ${booking.status.toLowerCase()} bookings.`,
      );
    }

    const [unit] = await tx
      .select()
      .from(units)
      .where(eq(units.id, booking.unitId))
      .for("update");

    if (!unit) {
      throw new NotFoundError("Unit not found");
    }

    const instRows = await tx
      .select()
      .from(installments)
      .where(eq(installments.bookingId, booking.id))
      .for("update");

    const allocationResult = allocatePayment({
      paymentAmountPkr: parsed.amountPkr,
      currentPaidTotalPkr: booking.paidTotal,
      netPricePkr: booking.netPrice,
      installments: instRows,
    });

    const receiptNo = await nextReceiptNumber(tx);
    const paidAt = parsed.paidAt ? new Date(parsed.paidAt) : new Date();

    // Update allocated installments
    for (const alloc of allocationResult.allocations) {
      await tx
        .update(installments)
        .set({
          paidAmount: alloc.newPaidPkr,
          status: alloc.newStatus,
          paidAt: alloc.newStatus === "PAID" ? paidAt : null,
          updatedAt: new Date(),
        })
        .where(eq(installments.id, alloc.installmentId));
    }

    // Insert payment record
    const [payment] = await tx
      .insert(payments)
      .values({
        bookingId: booking.id,
        receiptNo,
        amount: parsed.amountPkr,
        method: parsed.method,
        chequeNo: parsed.chequeNo?.trim() || null,
        bank: parsed.bank?.trim() || null,
        paidAt,
        notes: parsed.notes?.trim() || null,
        receivedBy: session.user.id,
      })
      .returning();

    // Update booking paid total and status if complete
    const isCompleted = allocationResult.isCompleted;
    await tx
      .update(bookings)
      .set({
        paidTotal: allocationResult.newPaidTotalPkr,
        status: isCompleted ? "COMPLETED" : "ACTIVE",
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, booking.id));

    // If fully paid: unit -> SOLD, booking COMPLETED, insert into sales
    if (isCompleted && unit.status === "BOOKED") {
      await changeUnitStatusInTx(
        tx,
        {
          unitId: unit.id,
          expectedVersion: unit.version,
          toStatus: "SOLD",
          bookingRef: booking.bookingNo,
          soldPricePkr: booking.netPrice,
          reason: `100% paid on booking ${booking.bookingNo}`,
        },
        session.user,
      );

      await tx.insert(sales).values({
        unitId: unit.id,
        clientId: booking.clientId,
        bookingId: booking.id,
        salePrice: booking.netPrice,
        soldAt: paidAt,
        notes: `Completed booking ${booking.bookingNo}`,
        status: "ACTIVE",
        createdBy: session.user.id,
      });
    }

    if (!payment) throw new Error("Failed to record payment");
    return payment;
  });

  logger.info({ paymentId: recorded.id, actorId: session.user.id }, "payment recorded");
  revalidateSalesPaths(undefined, parsed.bookingId);
  return recorded;
}

export async function returnBooking(input: unknown) {
  const parsed = parseInput(returnBookingSchema, input);
  const session = await requireSession();
  assertCan(session.user.role, "bookings.return");

  const refunded = await db.transaction(async (tx) => {
    const [booking] = await tx
      .select()
      .from(bookings)
      .where(eq(bookings.id, parsed.bookingId))
      .for("update");

    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    if (booking.status !== "ACTIVE") {
      throw new ValidationError(`Cannot return a booking with status ${booking.status}.`);
    }

    const [unit] = await tx
      .select()
      .from(units)
      .where(eq(units.id, booking.unitId))
      .for("update");

    if (!unit) {
      throw new NotFoundError("Unit not found");
    }

    const { deductionPkr, refundAmountPkr } = calculateRefund({
      paidTotalPkr: booking.paidTotal,
      deductionType: parsed.deductionType,
      deductionValue: parsed.deductionValue,
    });

    const [refundRecord] = await tx
      .insert(refunds)
      .values({
        bookingId: booking.id,
        unitId: unit.id,
        clientId: booking.clientId,
        paidTotal: booking.paidTotal,
        deduction: deductionPkr,
        refundAmount: refundAmountPkr,
        method: parsed.method,
        chequeNo: parsed.chequeNo?.trim() || null,
        bank: parsed.bank?.trim() || null,
        reason: parsed.reason,
        paidAt: new Date(),
        approvedBy: session.user.id,
      })
      .returning();

    // Mark booking RETURNED
    await tx
      .update(bookings)
      .set({
        status: "RETURNED",
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, booking.id));

    // Cancel pending installments
    await tx
      .update(installments)
      .set({
        status: "CANCELLED",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(installments.bookingId, booking.id),
          sql`${installments.status} IN ('PENDING', 'PARTIAL')`,
        ),
      );

    // Unit status -> AVAILABLE
    await changeUnitStatusInTx(
      tx,
      {
        unitId: unit.id,
        expectedVersion: unit.version,
        toStatus: "AVAILABLE",
        reason: `Booking ${booking.bookingNo} returned: ${parsed.reason}`,
      },
      session.user,
    );

    if (!refundRecord) throw new Error("Failed to refund booking");
    return refundRecord;
  });

  logger.info({ refundId: refunded.id, actorId: session.user.id }, "booking returned");
  revalidateSalesPaths(refunded.unitId ?? undefined, parsed.bookingId);
  return refunded;
}

export async function createDirectSale(input: unknown) {
  const parsed = parseInput(createDirectSaleSchema, input);
  const session = await requireSession();
  assertCan(session.user.role, "sales.create");

  const created = await db.transaction(async (tx) => {
    const client = await upsertClientAndKin(tx, parsed.client, parsed.nextOfKin);

    const [unit] = await tx
      .select()
      .from(units)
      .where(and(eq(units.id, parsed.unitId), isNull(units.archivedAt)))
      .for("update");

    if (!unit) {
      throw new NotFoundError("Unit not found");
    }

    if (!unit.isSellable) {
      throw new ValidationError("This unit is not sellable.");
    }

    if (unit.status !== "AVAILABLE") {
      throw new ValidationError(
        `Unit is not available (current status: ${unit.status}).`,
      );
    }

    const computedPrice = computeTotalPrice(
      unit.ratePerSqftPkr,
      unit.netAreaSqft,
      unit.priceAdjustmentPkr,
    );

    // If sale price differs from computed price, ADMIN permission is required
    if (parsed.salePricePkr !== computedPrice) {
      assertCan(session.user.role, "units.manage");
      if (
        !parsed.priceAdjustmentReason ||
        parsed.priceAdjustmentReason.trim().length === 0
      ) {
        throw new ValidationError(
          "A reason is required when sale price differs from asking price.",
        );
      }
    }

    const saleRef = `SALE-${unit.unitCode}-${new Date().getFullYear()}`;

    // Unit -> SOLD
    await changeUnitStatusInTx(
      tx,
      {
        unitId: unit.id,
        expectedVersion: unit.version,
        toStatus: "SOLD",
        bookingRef: saleRef,
        soldPricePkr: parsed.salePricePkr,
        reason: parsed.notes || `Direct sale to ${client.fullName}`,
      },
      session.user,
    );

    const [saleRecord] = await tx
      .insert(sales)
      .values({
        unitId: unit.id,
        clientId: client.id,
        salePrice: parsed.salePricePkr,
        soldAt: new Date(),
        notes: parsed.notes?.trim() || null,
        status: "ACTIVE",
        createdBy: session.user.id,
      })
      .returning();

    if (!saleRecord) throw new Error("Failed to create sale");
    return saleRecord;
  });

  logger.info({ saleId: created.id, actorId: session.user.id }, "direct sale created");
  revalidateSalesPaths(parsed.unitId);
  return created;
}

export async function buybackSale(input: unknown) {
  const parsed = parseInput(buybackSaleSchema, input);
  const session = await requireSession();
  assertCan(session.user.role, "sales.buyback");

  const created = await db.transaction(async (tx) => {
    const [unit] = await tx
      .select()
      .from(units)
      .where(eq(units.id, parsed.unitId))
      .for("update");

    if (!unit) {
      throw new NotFoundError("Unit not found");
    }

    if (unit.status !== "SOLD") {
      throw new ValidationError(
        `Only SOLD units can be bought back (current status: ${unit.status}).`,
      );
    }

    let clientId: string | null = null;
    let originalPricePkr = unit.soldPricePkr || "0.00";

    if (parsed.saleId) {
      const [sale] = await tx
        .select()
        .from(sales)
        .where(eq(sales.id, parsed.saleId))
        .for("update");

      if (sale) {
        clientId = sale.clientId;
        originalPricePkr = sale.salePrice;
        await tx
          .update(sales)
          .set({ status: "BOUGHT_BACK" })
          .where(eq(sales.id, sale.id));
      }
    } else if (parsed.bookingId) {
      const [booking] = await tx
        .select()
        .from(bookings)
        .where(eq(bookings.id, parsed.bookingId))
        .for("update");

      if (booking) {
        clientId = booking.clientId;
        originalPricePkr = booking.netPrice;
      }
    }

    if (!clientId) {
      // Find latest sale or booking for this unit
      const [latestSale] = await tx
        .select()
        .from(sales)
        .where(eq(sales.unitId, unit.id))
        .orderBy(desc(sales.soldAt))
        .limit(1);

      if (latestSale) {
        clientId = latestSale.clientId;
        originalPricePkr = latestSale.salePrice;
        await tx
          .update(sales)
          .set({ status: "BOUGHT_BACK" })
          .where(eq(sales.id, latestSale.id));
      } else {
        const [latestBooking] = await tx
          .select()
          .from(bookings)
          .where(and(eq(bookings.unitId, unit.id), eq(bookings.status, "COMPLETED")))
          .orderBy(desc(bookings.updatedAt))
          .limit(1);

        if (latestBooking) {
          clientId = latestBooking.clientId;
          originalPricePkr = latestBooking.netPrice;
        }
      }
    }

    if (!clientId) {
      throw new ValidationError(
        "Could not identify the client of the sold unit for buyback.",
      );
    }

    const [buybackRecord] = await tx
      .insert(buybacks)
      .values({
        unitId: unit.id,
        clientId,
        saleId: parsed.saleId || null,
        bookingId: parsed.bookingId || null,
        originalPrice: originalPricePkr,
        buybackAmount: parsed.buybackAmountPkr,
        method: parsed.method,
        chequeNo: parsed.chequeNo?.trim() || null,
        bank: parsed.bank?.trim() || null,
        reason: parsed.reason,
        paidAt: parsed.paidAt ? new Date(parsed.paidAt) : new Date(),
        approvedBy: session.user.id,
      })
      .returning();

    // Unit status: SOLD -> AVAILABLE
    await changeUnitStatusInTx(
      tx,
      {
        unitId: unit.id,
        expectedVersion: unit.version,
        toStatus: "AVAILABLE",
        reason: `Buyback: ${parsed.reason}`,
      },
      session.user,
    );

    if (!buybackRecord) throw new Error("Failed to create buyback");
    return buybackRecord;
  });

  logger.info({ buybackId: created.id, actorId: session.user.id }, "buyback completed");
  revalidateSalesPaths(parsed.unitId);
  return created;
}

export async function expireReservationsCron() {
  const now = new Date();
  const expired = await db
    .select({
      id: reservations.id,
      unitId: reservations.unitId,
    })
    .from(reservations)
    .where(
      and(eq(reservations.status, "ACTIVE"), sql`${reservations.expiresAt} < ${now}`),
    );

  let expiredCount = 0;
  for (const res of expired) {
    try {
      await db.transaction(async (tx) => {
        const [unit] = await tx
          .select()
          .from(units)
          .where(eq(units.id, res.unitId))
          .for("update");

        if (unit && unit.status === "RESERVED") {
          await changeUnitStatusInTx(
            tx,
            {
              unitId: unit.id,
              expectedVersion: unit.version,
              toStatus: "AVAILABLE",
              reason: "Reservation expired automatically",
            },
            { id: "system", role: "ADMIN" },
          );
        }

        await tx
          .update(reservations)
          .set({
            status: "EXPIRED",
            updatedAt: new Date(),
          })
          .where(eq(reservations.id, res.id));
      });
      expiredCount++;
    } catch (err) {
      logger.error({ err, reservationId: res.id }, "failed to expire reservation");
    }
  }

  return { expiredCount };
}
