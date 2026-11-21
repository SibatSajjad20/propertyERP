/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use server";

import { and, desc, eq, isNull, or, sql } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import type { z } from "zod";
import { db } from "@/db";
import {
  bookings,
  buybacks,
  clientDocuments,
  clients,
  installments,
  nextOfKin,
  payments,
  refunds,
  reservations,
  sales,
} from "@/db/schema/sales";
import { upsertClientAndKin } from "./client-upsert";
import { allocateDocumentNumbers } from "./document-numbers";
import { requiredDocumentErrorMessage } from "@/features/documents/required";
import { units } from "@/db/schema/units";
import { invalidateDashboardBundleCache } from "@/features/dashboard/queries";
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

  const documents = await db
    .select({
      id: clientDocuments.id,
      ownerType: clientDocuments.ownerType,
      clientId: clientDocuments.clientId,
      kinId: clientDocuments.kinId,
      docType: clientDocuments.docType,
      mimeType: clientDocuments.mimeType,
      replacedAt: clientDocuments.replacedAt,
    })
    .from(clientDocuments)
    .where(
      and(eq(clientDocuments.clientId, client.id), isNull(clientDocuments.replacedAt)),
    );

  return { client, nextOfKin: kin ?? null, documents };
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
import {
  errorMessage,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors";
import { logger } from "@/lib/logger";

function formatActionError(err: unknown): string {
  const pgCode =
    typeof err === "object" && err !== null
      ? ((err as { code?: string; cause?: { code?: string } }).code ??
        (err as { cause?: { code?: string } }).cause?.code)
      : undefined;
  if (pgCode === "23505") {
    return "A duplicate record conflict occurred. Please retry.";
  }
  return errorMessage(err);
}
import { effectivePricingArea } from "@/lib/area";
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

function revalidateSalesPaths(unitId?: string, bookingId?: string) {
  invalidateDashboardBundleCache();
  revalidateTag("dashboard", "max");
  revalidateTag("report-summary", "max");
  revalidatePath("/inventory");
  revalidatePath("/bookings");
  revalidatePath("/reservations");
  revalidatePath("/sold");
  revalidatePath("/");
  if (unitId) revalidatePath(`/units/${unitId}`);
  if (bookingId) revalidatePath(`/bookings/${bookingId}`);
}

async function requireClientDocuments(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  clientId: string,
  kinId: string,
) {
  const docs = await tx
    .select({
      ownerType: clientDocuments.ownerType,
      docType: clientDocuments.docType,
      replacedAt: clientDocuments.replacedAt,
      kinId: clientDocuments.kinId,
    })
    .from(clientDocuments)
    .where(
      and(eq(clientDocuments.clientId, clientId), isNull(clientDocuments.replacedAt)),
    );

  const relevant = docs.filter(
    (doc) =>
      doc.ownerType === "CLIENT" || (doc.ownerType === "KIN" && doc.kinId === kinId),
  );
  const message = requiredDocumentErrorMessage(relevant);
  if (message) throw new ValidationError(message);
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function nextBookingNumber(tx: Tx): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `SM-BK-${year}-`;
  const [row] = await tx
    .select({ count: sql<number>`count(*)::int` })
    .from(bookings)
    .where(sql`${bookings.bookingNo} LIKE ${prefix + "%"}`);

  let seq = Number(row?.count ?? 0) + 1;
  let candidate = `${prefix}${seq.toString().padStart(4, "0")}`;

  const [existing] = await tx
    .select({ id: bookings.id })
    .from(bookings)
    .where(eq(bookings.bookingNo, candidate))
    .limit(1);

  if (existing) {
    const [maxRow] = await tx
      .select({
        maxSeq: sql<number>`COALESCE(MAX(CASE WHEN SUBSTR(${bookings.bookingNo}, ${prefix.length + 1}) ~ '^[0-9]+$' THEN SUBSTR(${bookings.bookingNo}, ${prefix.length + 1})::int ELSE 0 END), 0)::int`,
      })
      .from(bookings)
      .where(sql`${bookings.bookingNo} LIKE ${prefix + "%"}`);
    seq = Number(maxRow?.maxSeq ?? 0) + 1;
    candidate = `${prefix}${seq.toString().padStart(4, "0")}`;
  }

  return candidate;
}

async function nextReceiptNumber(tx: Tx): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `SM-REC-${year}-`;
  const [row] = await tx
    .select({ count: sql<number>`count(*)::int` })
    .from(payments)
    .where(sql`${payments.receiptNo} LIKE ${prefix + "%"}`);

  let seq = Number(row?.count ?? 0) + 1;
  let candidate = `${prefix}${seq.toString().padStart(4, "0")}`;

  const [existing] = await tx
    .select({ id: payments.id })
    .from(payments)
    .where(eq(payments.receiptNo, candidate))
    .limit(1);

  if (existing) {
    const [maxRow] = await tx
      .select({
        maxSeq: sql<number>`COALESCE(MAX(CASE WHEN SUBSTR(${payments.receiptNo}, ${prefix.length + 1}) ~ '^[0-9]+$' THEN SUBSTR(${payments.receiptNo}, ${prefix.length + 1})::int ELSE 0 END), 0)::int`,
      })
      .from(payments)
      .where(sql`${payments.receiptNo} LIKE ${prefix + "%"}`);
    seq = Number(maxRow?.maxSeq ?? 0) + 1;
    candidate = `${prefix}${seq.toString().padStart(4, "0")}`;
  }

  return candidate;
}

async function nextTokenReceiptNumber(tx: Tx): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `SM-TOK-${year}-`;
  const [maxRow] = await tx
    .select({
      maxSeq: sql<number>`COALESCE(MAX(CASE WHEN SUBSTR(${reservations.tokenReceiptNo}, ${prefix.length + 1}) ~ '^[0-9]+$' THEN SUBSTR(${reservations.tokenReceiptNo}, ${prefix.length + 1})::int ELSE 0 END), 0)::int`,
    })
    .from(reservations)
    .where(sql`${reservations.tokenReceiptNo} LIKE ${prefix + "%"}`);
  const seq = Number(maxRow?.maxSeq ?? 0) + 1;
  return `${prefix}${seq.toString().padStart(4, "0")}`;
}

export async function createReservation(input: unknown) {
  const parsed = parseInput(createReservationSchema, input);
  const session = await requireSession();
  assertCan(session.user.role, "reservations.create");

  const created = await db.transaction(async (tx) => {
    const { client } = await upsertClientAndKin(tx, parsed.client, parsed.nextOfKin);

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

    const tokenPaisa =
      parsed.tokenAmount && parsed.tokenAmount.trim() !== ""
        ? parseDecimal(parsed.tokenAmount)
        : 0n;
    const hasToken = tokenPaisa > 0n;
    if (hasToken && !parsed.tokenPaymentMethod) {
      throw new ValidationError("Select a payment method for the token amount.");
    }
    const tokenReceiptNo = hasToken ? await nextTokenReceiptNumber(tx) : null;

    const [reservation] = await tx
      .insert(reservations)
      .values({
        unitId: unit.id,
        clientId: client.id,
        startAt,
        expiresAt,
        durationDays: parsed.durationDays,
        status: "ACTIVE",
        tokenAmount: formatDecimal(tokenPaisa),
        tokenPaymentMethod: hasToken ? (parsed.tokenPaymentMethod ?? "CASH") : null,
        tokenChequeNo: hasToken ? parsed.tokenChequeNo?.trim() || null : null,
        tokenBank: hasToken ? parsed.tokenBank?.trim() || null : null,
        tokenReference: hasToken ? parsed.tokenReference?.trim() || null : null,
        tokenReceiptNo,
        tokenPaidAt: hasToken ? startAt : null,
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
  try {
    const parsed = parseInput(createBookingSchema, input);
    const session = await requireSession();
    assertCan(session.user.role, "bookings.create");

    const created = await db.transaction(async (tx) => {
      const { client, kin } = await upsertClientAndKin(
        tx,
        parsed.client,
        parsed.nextOfKin,
      );
      if (!kin) {
        throw new ValidationError("Next of kin is required");
      }

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

      // Find matching active reservation for this unit & client (if any)
      const [activeReservation] = await tx
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

      // Unit must be AVAILABLE or RESERVED by this client
      if (unit.status !== "AVAILABLE") {
        if (unit.status === "RESERVED") {
          if (!activeReservation) {
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
        effectivePricingArea(unit.grossAreaSqft, unit.netAreaSqft),
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
      const netPricePaisa = parseDecimal(netPricePkr);

      const useDownValue =
        parsed.downPaymentValue && parsed.downPaymentValue.trim() !== "";
      const effectiveDownType = useDownValue ? parsed.downPaymentType : "AMOUNT";
      const effectiveDownValue = useDownValue
        ? parsed.downPaymentValue!
        : (parsed.downPaymentPkr ?? "0");

      const usePossValue = parsed.possessionValue && parsed.possessionValue.trim() !== "";
      const effectivePossType = usePossValue ? parsed.possessionType : "AMOUNT";
      const effectivePossValue = usePossValue
        ? parsed.possessionValue!
        : (parsed.possessionAmountPkr ?? "0");

      const effectiveBalloonType = parsed.balloonType ?? "PERCENT";
      const effectiveBalloonValue = parsed.balloonValue ?? "10";

      // Check token adjustment from reservation
      const availableTokenPaisa =
        activeReservation && parsed.adjustTokenAmount !== false
          ? parseDecimal(activeReservation.tokenAmount || "0")
          : 0n;

      const schedule = generateSchedule({
        listPricePkr,
        discountType: parsed.discountType,
        discountValue: parsed.discountValue,
        downPaymentType: effectiveDownType,
        downPaymentValue: effectiveDownValue,
        possessionType: effectivePossType,
        possessionValue: effectivePossValue,
        balloonType: effectiveBalloonType,
        balloonValue: effectiveBalloonValue,
        tokenAdjustedPkr: formatDecimal(availableTokenPaisa),
        plan: parsed.plan,
        installmentCount: parsed.installmentCount,
        startDate: new Date(parsed.startDate),
      });

      const downPaymentPaisa = parseDecimal(schedule.downPaymentPkr);
      const possessionPaisa = parseDecimal(schedule.possessionAmountPkr);

      if (downPaymentPaisa <= 0n) {
        throw new ValidationError("Down payment must be greater than 0.");
      }
      if (possessionPaisa <= 0n) {
        throw new ValidationError(
          "Possession payment is required and must be greater than 0.",
        );
      }
      if (!schedule.isValid) {
        throw new ValidationError(
          schedule.validationError ||
            "Down payment, balloon payments, and possession amount exceed net price.",
        );
      }

      const bookingNo = await nextBookingNumber(tx);
      const receiptNo = await nextReceiptNumber(tx);
      const bookedAt = new Date();
      const numbers = await allocateDocumentNumbers(tx, unit.unitCode, bookedAt);

      const isFullyPaid = downPaymentPaisa >= netPricePaisa;

      // Insert booking
      const [booking] = await tx
        .insert(bookings)
        .values({
          unitId: unit.id,
          clientId: client.id,
          bookingNo,
          serialNo: numbers.serialNo,
          applicationFormNo: numbers.applicationFormNo,
          registrationNo: numbers.registrationNo,
          listPrice: listPricePkr,
          discountType: parsed.discountType || null,
          discountValue: parsed.discountValue || "0.00",
          discountReason: parsed.discountReason?.trim() || null,
          netPrice: netPricePkr,
          downPaymentType: effectiveDownType,
          downPaymentInputValue: effectiveDownValue,
          downPayment: schedule.downPaymentPkr,
          possessionType: effectivePossType,
          possessionInputValue: effectivePossValue,
          possessionAmount: schedule.possessionAmountPkr,
          balloonType: effectiveBalloonType,
          balloonInputValue: effectiveBalloonValue || "0",
          balloonAmountPerYear: schedule.balloonAmountPerYearPkr,
          balloonTotalAmount: schedule.balloonTotalAmountPkr,
          tokenAdjustedAmount: schedule.tokenAdjustedPkr,
          reservationId: activeReservation?.id ?? null,
          plan: parsed.plan,
          installmentCount: parsed.installmentCount,
          startDate: new Date(parsed.startDate),
          status: isFullyPaid ? "COMPLETED" : "ACTIVE",
          paidTotal: schedule.downPaymentPkr,
          salesAgent: session.user.name,
          bookingOffice: "SARDAR'S MALL",
          createdBy: session.user.id,
        })
        .returning();

      if (!booking) throw new Error("Failed to create booking");

      // Convert existing active reservation and link token adjustment
      if (activeReservation) {
        await tx
          .update(reservations)
          .set({
            status: "CONVERTED",
            tokenAdjustedToBookingId:
              parseDecimal(schedule.tokenAdjustedPkr) > 0n ? booking.id : null,
            updatedAt: new Date(),
          })
          .where(eq(reservations.id, activeReservation.id));
      }

      // Insert installments (REGULAR + BALLOON + POSSESSION)
      if (schedule.installments.length > 0) {
        await tx.insert(installments).values(
          schedule.installments.map((inst) => ({
            bookingId: booking.id,
            seq: inst.seq,
            type: inst.type,
            label: inst.label,
            dueDate: inst.dueDate,
            amount: inst.amountPkr,
            paidAmount: "0.00",
            status: "PENDING" as const,
          })),
        );
      }

      // Insert down payment transaction for the net amount collected now
      // (Token amount is already recorded on the reservation and adjusted above so reports never double-count)
      const netDownPaymentPayablePaisa = parseDecimal(schedule.payableDownPaymentNowPkr);
      if (netDownPaymentPayablePaisa > 0n) {
        const tokenNote =
          parseDecimal(schedule.tokenAdjustedPkr) > 0n
            ? ` (after Rs ${schedule.tokenAdjustedPkr} token adjustment)`
            : "";
        await tx.insert(payments).values({
          bookingId: booking.id,
          receiptNo,
          category: "DOWN_PAYMENT",
          amount: schedule.payableDownPaymentNowPkr,
          surchargeAmount: "0.00",
          method: parsed.paymentMethod,
          chequeNo: parsed.chequeNo?.trim() || null,
          bank: parsed.bank?.trim() || null,
          reference: parsed.notes?.trim() || parsed.chequeNo?.trim() || "Down payment",
          paidAt: new Date(),
          notes: `${parsed.notes?.trim() || "Down payment on booking"}${tokenNote}`,
          receivedBy: session.user.id,
        });
      }

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
          serialNo: numbers.serialNo,
          applicationFormNo: numbers.applicationFormNo,
          registrationNo: numbers.registrationNo,
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
    return { ok: true as const, data: created };
  } catch (err) {
    logger.error({ err }, "createBooking failed");
    return { ok: false as const, error: formatActionError(err) };
  }
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
        reference: parsed.notes?.trim() || parsed.chequeNo?.trim() || null,
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
        serialNo: booking.serialNo,
        applicationFormNo: booking.applicationFormNo,
        registrationNo: booking.registrationNo,
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
  try {
    const parsed = parseInput(createDirectSaleSchema, input);
    const session = await requireSession();
    assertCan(session.user.role, "sales.create");

    const created = await db.transaction(async (tx) => {
      const { client, kin } = await upsertClientAndKin(
        tx,
        parsed.client,
        parsed.nextOfKin,
      );
      if (!kin) {
        throw new ValidationError("Next of kin is required");
      }

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
        effectivePricingArea(unit.grossAreaSqft, unit.netAreaSqft),
        unit.priceAdjustmentPkr,
      );

      // If sale price differs from computed price, ADMIN permission is required
      if (parseDecimal(parsed.salePricePkr) !== parseDecimal(computedPrice)) {
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

      const soldAt = new Date();
      const numbers = await allocateDocumentNumbers(tx, unit.unitCode, soldAt);
      const saleRef = numbers.applicationFormNo;

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
          serialNo: numbers.serialNo,
          applicationFormNo: numbers.applicationFormNo,
          registrationNo: numbers.registrationNo,
          salePrice: parsed.salePricePkr,
          soldAt,
          notes: parsed.notes?.trim() || null,
          paymentMethod: parsed.paymentMethod,
          chequeNo: parsed.chequeNo?.trim() || null,
          bank: parsed.bank?.trim() || null,
          reference: parsed.notes?.trim() || parsed.chequeNo?.trim() || "Full payment",
          salesAgent: session.user.name,
          bookingOffice: "SARDAR'S MALL",
          status: "ACTIVE",
          createdBy: session.user.id,
        })
        .returning();

      if (!saleRecord) throw new Error("Failed to create sale");
      return saleRecord;
    });

    logger.info({ saleId: created.id, actorId: session.user.id }, "direct sale created");
    revalidateSalesPaths(parsed.unitId);
    return { ok: true as const, data: created };
  } catch (err) {
    logger.error({ err }, "createDirectSale failed");
    return { ok: false as const, error: formatActionError(err) };
  }
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
