"use server";

import { asc, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { db } from "@/db";
import { auditLog } from "@/db/schema/audit";
import { bookings, installments, payments, sales } from "@/db/schema/sales";
import { units } from "@/db/schema/units";
import { requireSession } from "@/lib/auth";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { formatDecimal, parseDecimal } from "@/lib/money";
import { assertCan } from "@/lib/permissions";
import { changeUnitStatusInTx } from "@/features/units/actions";
import { recalculateInstallmentAllocations, validateReschedule } from "./calculator";
import { getClientProfileWithBookings, searchInstallmentsClients } from "./queries";
import {
  editPaymentSchema,
  recordInstallmentPaymentSchema,
  rescheduleInstallmentsSchema,
  voidPaymentSchema,
} from "./schema";

export async function searchClientsAction(q?: string) {
  const session = await requireSession();
  assertCan(session.user.role, "installments.read");
  return searchInstallmentsClients(q);
}

export async function getClientProfileAction(clientId: string) {
  const session = await requireSession();
  assertCan(session.user.role, "installments.read");
  return getClientProfileWithBookings(clientId);
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

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

function revalidateInstallmentPaths(unitId?: string, bookingId?: string) {
  revalidatePath("/installments");
  revalidatePath("/bookings");
  revalidatePath("/reports");
  revalidatePath("/reports/summary");
  revalidatePath("/reports/installments");
  revalidatePath("/reports/client-ledger");
  revalidatePath("/");
  if (unitId) revalidatePath(`/units/${unitId}`);
  if (bookingId) revalidatePath(`/bookings/${bookingId}`);
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

/**
 * Records an installment payment.
 * Allocates waterfall to unpaid installments.
 * When fully paid, auto-moves unit to SOLD and booking to COMPLETED.
 */
export async function recordInstallmentPayment(input: unknown) {
  const parsed = parseInput(recordInstallmentPaymentSchema, input);
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

    const receiptNo = await nextReceiptNumber(tx);
    const paidAt = parsed.paidAt ? new Date(parsed.paidAt) : new Date();

    // Insert payment record
    const [newPayment] = await tx
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
        isVoided: false,
      })
      .returning();

    if (!newPayment) {
      throw new Error("Failed to record payment");
    }

    // Fetch all non-voided payments for booking to recalculate allocations
    const allPayments = await tx
      .select()
      .from(payments)
      .where(eq(payments.bookingId, booking.id))
      .for("update");

    const allInstRows = await tx
      .select()
      .from(installments)
      .where(eq(installments.bookingId, booking.id))
      .for("update");

    const allocationResult = recalculateInstallmentAllocations({
      booking: {
        id: booking.id,
        netPrice: booking.netPrice,
        downPayment: booking.downPayment,
      },
      installments: allInstRows,
      payments: allPayments,
      asOfDate: new Date(),
    });

    // Update installments with new paidAmount, status, receiptNos
    for (const alloc of allocationResult.installments) {
      await tx
        .update(installments)
        .set({
          paidAmount: alloc.paidAmount,
          status: alloc.status,
          receiptNos: alloc.receiptNos,
          paidAt: alloc.status === "PAID" ? paidAt : null,
          updatedAt: new Date(),
        })
        .where(eq(installments.id, alloc.id));
    }

    // Update booking paid total and status
    const isCompleted = allocationResult.isCompleted;
    await tx
      .update(bookings)
      .set({
        paidTotal: allocationResult.paidTotalPkr,
        status: isCompleted ? "COMPLETED" : "ACTIVE",
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, booking.id));

    // Audit log
    await tx.insert(auditLog).values({
      actorId: session.user.id,
      entity: "payments",
      entityId: newPayment.id,
      action: "PAYMENT_RECORD",
      before: null,
      after: {
        receiptNo,
        amount: parsed.amountPkr,
        bookingNo: booking.bookingNo,
        paidTotalPkr: allocationResult.paidTotalPkr,
        isCompleted,
      },
    });

    // Auto-move unit to SOLD if completed
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

    return {
      payment: newPayment,
      receiptNo,
      unitId: unit.id,
      bookingId: booking.id,
      isCompleted,
    };
  });

  logger.info(
    {
      paymentId: recorded.payment.id,
      receiptNo: recorded.receiptNo,
      actorId: session.user.id,
    },
    "payment recorded",
  );

  revalidateInstallmentPaths(recorded.unitId, recorded.bookingId);
  return recorded;
}

/**
 * Voids a payment. ADMIN only.
 * Marks isVoided = true and recalculates allocation across all installments.
 */
export async function voidPayment(input: unknown) {
  const parsed = parseInput(voidPaymentSchema, input);
  const session = await requireSession();
  assertCan(session.user.role, "payments.void");

  const result = await db.transaction(async (tx) => {
    const [payment] = await tx
      .select()
      .from(payments)
      .where(eq(payments.id, parsed.paymentId))
      .for("update");

    if (!payment) {
      throw new NotFoundError("Payment not found");
    }

    if (payment.isVoided) {
      throw new ValidationError("Payment is already voided");
    }

    const [booking] = await tx
      .select()
      .from(bookings)
      .where(eq(bookings.id, payment.bookingId))
      .for("update");

    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    const beforeState = {
      id: payment.id,
      receiptNo: payment.receiptNo,
      amount: payment.amount,
      isVoided: payment.isVoided,
      bookingPaidTotal: booking.paidTotal,
      bookingStatus: booking.status,
    };

    // Mark payment voided
    const now = new Date();
    await tx
      .update(payments)
      .set({
        isVoided: true,
        voidedAt: now,
        voidedReason: parsed.reason.trim(),
        voidedBy: session.user.id,
        updatedAt: now,
      })
      .where(eq(payments.id, payment.id));

    // Fetch all payments and installments for recalculation
    const allPayments = await tx
      .select()
      .from(payments)
      .where(eq(payments.bookingId, booking.id))
      .for("update");

    const allInstRows = await tx
      .select()
      .from(installments)
      .where(eq(installments.bookingId, booking.id))
      .for("update");

    const allocationResult = recalculateInstallmentAllocations({
      booking: {
        id: booking.id,
        netPrice: booking.netPrice,
        downPayment: booking.downPayment,
      },
      installments: allInstRows,
      payments: allPayments,
      asOfDate: now,
    });

    // Update installments
    for (const alloc of allocationResult.installments) {
      await tx
        .update(installments)
        .set({
          paidAmount: alloc.paidAmount,
          status: alloc.status,
          receiptNos: alloc.receiptNos,
          paidAt: alloc.status === "PAID" ? alloc.dueDate : null,
          updatedAt: now,
        })
        .where(eq(installments.id, alloc.id));
    }

    // Update booking paidTotal and reset status if needed
    const newStatus = allocationResult.isCompleted ? "COMPLETED" : "ACTIVE";
    await tx
      .update(bookings)
      .set({
        paidTotal: allocationResult.paidTotalPkr,
        status: newStatus,
        updatedAt: now,
      })
      .where(eq(bookings.id, booking.id));

    // Audit log
    await tx.insert(auditLog).values({
      actorId: session.user.id,
      entity: "payments",
      entityId: payment.id,
      action: "PAYMENT_VOID",
      before: beforeState,
      after: {
        id: payment.id,
        receiptNo: payment.receiptNo,
        isVoided: true,
        voidedReason: parsed.reason.trim(),
        newBookingPaidTotal: allocationResult.paidTotalPkr,
        newBookingStatus: newStatus,
      },
    });

    return {
      paymentId: payment.id,
      bookingId: booking.id,
      unitId: booking.unitId,
      paidTotal: allocationResult.paidTotalPkr,
    };
  });

  logger.info(
    { paymentId: result.paymentId, actorId: session.user.id },
    "payment voided",
  );
  revalidateInstallmentPaths(result.unitId, result.bookingId);
  return result;
}

/**
 * Edits a payment amount, method, notes, etc. ADMIN only.
 * Recalculates allocation across all installments.
 */
export async function editPayment(input: unknown) {
  const parsed = parseInput(editPaymentSchema, input);
  const session = await requireSession();
  assertCan(session.user.role, "payments.edit");

  const result = await db.transaction(async (tx) => {
    const [payment] = await tx
      .select()
      .from(payments)
      .where(eq(payments.id, parsed.paymentId))
      .for("update");

    if (!payment) {
      throw new NotFoundError("Payment not found");
    }

    if (payment.isVoided) {
      throw new ValidationError("Cannot edit a voided payment");
    }

    const [booking] = await tx
      .select()
      .from(bookings)
      .where(eq(bookings.id, payment.bookingId))
      .for("update");

    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    const beforeState = {
      amount: payment.amount,
      method: payment.method,
      chequeNo: payment.chequeNo,
      bank: payment.bank,
      notes: payment.notes,
      paidAt: payment.paidAt,
      bookingPaidTotal: booking.paidTotal,
    };

    const now = new Date();
    const paidAt = parsed.paidAt ? new Date(parsed.paidAt) : payment.paidAt;

    await tx
      .update(payments)
      .set({
        amount: parsed.amountPkr,
        method: parsed.method,
        chequeNo: parsed.chequeNo?.trim() || null,
        bank: parsed.bank?.trim() || null,
        paidAt,
        notes: parsed.notes?.trim() || null,
        updatedAt: now,
      })
      .where(eq(payments.id, payment.id));

    // Fetch all payments for booking and recalculate allocations
    const allPayments = await tx
      .select()
      .from(payments)
      .where(eq(payments.bookingId, booking.id))
      .for("update");

    const allInstRows = await tx
      .select()
      .from(installments)
      .where(eq(installments.bookingId, booking.id))
      .for("update");

    const allocationResult = recalculateInstallmentAllocations({
      booking: {
        id: booking.id,
        netPrice: booking.netPrice,
        downPayment: booking.downPayment,
      },
      installments: allInstRows,
      payments: allPayments,
      asOfDate: now,
    });

    for (const alloc of allocationResult.installments) {
      await tx
        .update(installments)
        .set({
          paidAmount: alloc.paidAmount,
          status: alloc.status,
          receiptNos: alloc.receiptNos,
          updatedAt: now,
        })
        .where(eq(installments.id, alloc.id));
    }

    const newStatus = allocationResult.isCompleted ? "COMPLETED" : "ACTIVE";
    await tx
      .update(bookings)
      .set({
        paidTotal: allocationResult.paidTotalPkr,
        status: newStatus,
        updatedAt: now,
      })
      .where(eq(bookings.id, booking.id));

    await tx.insert(auditLog).values({
      actorId: session.user.id,
      entity: "payments",
      entityId: payment.id,
      action: "PAYMENT_EDIT",
      before: beforeState,
      after: {
        amount: parsed.amountPkr,
        method: parsed.method,
        reason: parsed.reason.trim(),
        newBookingPaidTotal: allocationResult.paidTotalPkr,
        newBookingStatus: newStatus,
      },
    });

    return {
      paymentId: payment.id,
      bookingId: booking.id,
      unitId: booking.unitId,
      paidTotal: allocationResult.paidTotalPkr,
    };
  });

  logger.info(
    { paymentId: result.paymentId, actorId: session.user.id },
    "payment edited",
  );
  revalidateInstallmentPaths(result.unitId, result.bookingId);
  return result;
}

/**
 * Reschedules unpaid installments. ADMIN only.
 * Live-validates that sum of new installments matches the remaining unpaid balance.
 */
export async function rescheduleInstallments(input: unknown) {
  const parsed = parseInput(rescheduleInstallmentsSchema, input);
  const session = await requireSession();
  assertCan(session.user.role, "installments.reschedule");

  const result = await db.transaction(async (tx) => {
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
        `Cannot reschedule ${booking.status.toLowerCase()} bookings.`,
      );
    }

    // Fetch all current installments
    const existingInst = await tx
      .select()
      .from(installments)
      .where(eq(installments.bookingId, booking.id))
      .orderBy(asc(installments.seq))
      .for("update");

    // Calculate remaining unpaid balance across all unpaid installments
    let unpaidBalancePaisa = 0n;
    const unpaidInstIds: string[] = [];

    for (const inst of existingInst) {
      const amtP = parseDecimal(inst.amount);
      const paidP = parseDecimal(inst.paidAmount);
      const rem = amtP - paidP;
      if (rem > 0n && inst.status !== "PAID" && inst.status !== "CANCELLED") {
        unpaidBalancePaisa += rem;
        unpaidInstIds.push(inst.id);
      }
    }

    const unpaidBalancePkr = formatDecimal(unpaidBalancePaisa);

    // Validate proposed installments against unpaid balance
    const validation = validateReschedule(
      unpaidBalancePkr,
      parsed.installments,
      parsed.reason,
    );

    if (!validation.valid) {
      throw new ValidationError(validation.error || "Reschedule validation failed");
    }

    const beforeState = existingInst.map((inst) => ({
      id: inst.id,
      seq: inst.seq,
      dueDate: inst.dueDate,
      amount: inst.amount,
      paidAmount: inst.paidAmount,
      status: inst.status,
    }));

    // Delete existing unpaid installments that are being replaced
    if (unpaidInstIds.length > 0) {
      await tx.delete(installments).where(inArray(installments.id, unpaidInstIds));
    }

    // Determine starting sequence number for new installments
    const paidSeqMax = existingInst
      .filter((i) => !unpaidInstIds.includes(i.id))
      .reduce((max, i) => Math.max(max, i.seq), 0);

    const now = new Date();
    // Insert new rescheduled installments
    const inserted = await tx
      .insert(installments)
      .values(
        parsed.installments.map((inst, idx) => {
          const dueDate = new Date(inst.dueDate);
          const isOverdue = dueDate < now;
          return {
            bookingId: booking.id,
            seq: paidSeqMax + idx + 1,
            dueDate,
            amount: inst.amountPkr,
            paidAmount: "0.00",
            status: isOverdue ? ("OVERDUE" as const) : ("PENDING" as const),
            createdAt: now,
            updatedAt: now,
          };
        }),
      )
      .returning();

    // Audit log
    await tx.insert(auditLog).values({
      actorId: session.user.id,
      entity: "installments",
      entityId: booking.id,
      action: "INSTALLMENT_RESCHEDULE",
      before: { count: beforeState.length, installments: beforeState },
      after: {
        reason: parsed.reason.trim(),
        unpaidBalancePkr,
        newInstallmentCount: inserted.length,
        newInstallments: inserted.map((i) => ({
          seq: i.seq,
          dueDate: i.dueDate,
          amount: i.amount,
        })),
      },
    });

    return {
      bookingId: booking.id,
      unitId: booking.unitId,
      rescheduledCount: inserted.length,
    };
  });

  logger.info(
    {
      bookingId: result.bookingId,
      count: result.rescheduledCount,
      actorId: session.user.id,
    },
    "installments rescheduled",
  );

  revalidateInstallmentPaths(result.unitId, result.bookingId);
  return result;
}
