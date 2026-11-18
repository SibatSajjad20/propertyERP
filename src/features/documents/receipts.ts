import "server-only";

import { cache } from "react";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { authorizedSignatories, companySettings, receipts } from "@/db/schema/sales";
import { allocateReceiptNumber } from "@/features/sales/document-numbers";
import { getBookingDetail, getSoldDetail } from "@/features/sales/queries";
import { effectivePricingArea, formatUnitDisplayCode } from "@/lib/area";
import { requireSession } from "@/lib/auth";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { assertCan } from "@/lib/permissions";
import {
  DEFAULT_BOOKING_OFFICE,
  computeReceiptTotals,
  installmentTypeLabel,
  typicalInstallmentAmount,
  type ReceiptPayment,
} from "./receipt-math";
import { renderReceiptPdf } from "./pdf/render";
import type { DownPaymentReceiptProps } from "./pdf/receipt-document";

function printDateLabel() {
  return new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function dateLabel(value: Date | string) {
  const d = value instanceof Date ? value : new Date(value);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export async function getCompanySettingsRow() {
  const [row] = await db.select().from(companySettings).limit(1);
  if (row) return row;
  const [created] = await db
    .insert(companySettings)
    .values({ bankName: "", accountTitle: "", iban: "" })
    .returning();
  return created!;
}

export const listActiveSignatories = cache(async function listActiveSignatories() {
  return db
    .select({
      id: authorizedSignatories.id,
      name: authorizedSignatories.name,
      designation: authorizedSignatories.designation,
      sortOrder: authorizedSignatories.sortOrder,
    })
    .from(authorizedSignatories)
    .where(eq(authorizedSignatories.isActive, true))
    .orderBy(asc(authorizedSignatories.sortOrder), asc(authorizedSignatories.name));
});

async function resolveSignatory(signatoryId: string | null | undefined) {
  const signatories = await listActiveSignatories();
  if (signatories.length === 0) {
    throw new ValidationError("No authorized signatories are configured.");
  }
  const picked =
    (signatoryId ? signatories.find((row) => row.id === signatoryId) : undefined) ??
    signatories[0]!;
  return picked;
}

async function ensureReceiptNo(input: {
  bookingId?: string | null;
  saleId?: string | null;
  signatoryId: string;
  createdBy: string;
}): Promise<string> {
  return db.transaction(async (tx) => {
    const existing = input.bookingId
      ? await tx
          .select()
          .from(receipts)
          .where(
            and(
              eq(receipts.bookingId, input.bookingId),
              eq(receipts.type, "DOWN_PAYMENT"),
            ),
          )
          .limit(1)
      : input.saleId
        ? await tx
            .select()
            .from(receipts)
            .where(
              and(eq(receipts.saleId, input.saleId), eq(receipts.type, "DOWN_PAYMENT")),
            )
            .limit(1)
        : [];

    const row = existing[0];
    if (row) {
      await tx
        .update(receipts)
        .set({ signatoryId: input.signatoryId })
        .where(eq(receipts.id, row.id));
      return row.receiptNo;
    }

    const receiptNo = await allocateReceiptNumber(tx, new Date());
    try {
      await tx.insert(receipts).values({
        bookingId: input.bookingId ?? null,
        saleId: input.saleId ?? null,
        receiptNo,
        type: "DOWN_PAYMENT",
        signatoryId: input.signatoryId,
        createdBy: input.createdBy,
      });
      return receiptNo;
    } catch {
      const [raced] = input.bookingId
        ? await tx
            .select()
            .from(receipts)
            .where(
              and(
                eq(receipts.bookingId, input.bookingId),
                eq(receipts.type, "DOWN_PAYMENT"),
              ),
            )
            .limit(1)
        : input.saleId
          ? await tx
              .select()
              .from(receipts)
              .where(
                and(eq(receipts.saleId, input.saleId), eq(receipts.type, "DOWN_PAYMENT")),
              )
              .limit(1)
          : [];
      if (raced) return raced.receiptNo;
      throw new ValidationError("Could not allocate a receipt number");
    }
  });
}

function toReceiptPayments(
  rows: Array<{
    amount: string;
    isVoided?: boolean;
    paidAt: Date | string;
    method?: string | null;
    bank?: string | null;
    reference?: string | null;
    chequeNo?: string | null;
    notes?: string | null;
  }>,
): ReceiptPayment[] {
  return rows.map((row) => ({
    amount: row.amount,
    isVoided: row.isVoided,
    paidAt: row.paidAt,
    method: row.method ?? undefined,
    bank: row.bank,
    reference: row.reference,
    chequeNo: row.chequeNo,
    notes: row.notes,
  }));
}

export async function buildBookingReceiptPdf(
  bookingId: string,
  signatoryId?: string | null,
) {
  const session = await requireSession();
  assertCan(session.user.role, "bookings.read");

  const data = await getBookingDetail(bookingId);
  if (!data) throw new NotFoundError("Booking not found");

  const payments = toReceiptPayments(data.payments);
  const activePayments = payments.filter((p) => !p.isVoided);
  if (activePayments.length === 0) {
    throw new ValidationError("Record a down payment first");
  }

  const signatory = await resolveSignatory(signatoryId);
  const settings = await getCompanySettingsRow();
  const totals = computeReceiptTotals({
    netPrice: data.booking.netPrice,
    downPayment: data.booking.downPayment,
    installmentCount: data.booking.installmentCount,
    payments,
  });
  const receiptNo = await ensureReceiptNo({
    bookingId: data.booking.id,
    signatoryId: signatory.id,
    createdBy: session.user.id,
  });

  const props: DownPaymentReceiptProps = {
    receiptNo,
    printDate: printDateLabel(),
    serialNo: data.booking.serialNo,
    applicationFormNo: data.booking.applicationFormNo,
    registrationNo: data.booking.registrationNo,
    unitCode: formatUnitDisplayCode(data.booking.unitCode, data.booking.categoryName),
    floorName: data.booking.floorName,
    unitType: data.booking.categoryName,
    netAreaSqft: String(
      effectivePricingArea(data.booking.grossAreaSqft, data.booking.netAreaSqft),
    ),
    ratePerSqftPkr: String(data.booking.ratePerSqftPkr),
    totalPrice: data.booking.netPrice,
    installmentType:
      totals.plan.kind === "FULL" ? "Full" : installmentTypeLabel(data.booking.plan),
    perInstallment:
      totals.plan.kind === "FULL" ? "0.00" : typicalInstallmentAmount(data.installments),
    bookingNo: data.booking.bookingNo,
    bookingDate: dateLabel(data.booking.createdAt),
    bookingOffice: data.booking.bookingOffice || DEFAULT_BOOKING_OFFICE,
    salesAgent: data.booking.salesAgent || data.booking.createdByName || "—",
    clientName: data.booking.clientName,
    relationPrefix: data.booking.clientRelationPrefix || "S/O",
    relationName: data.booking.clientRelationName || "",
    clientCnic: data.booking.clientCnic,
    clientEmail: data.booking.clientEmail || "—",
    clientPhone: data.booking.clientPhone,
    clientAddress: data.booking.homeAddress,
    bankName: settings.bankName,
    accountTitle: settings.accountTitle,
    iban: settings.iban,
    downPaymentLabel: totals.plan.percentLabel,
    downPaymentRequired: totals.plan.required,
    totalReceived: totals.received,
    balance: totals.balance,
    payments: totals.listed,
    showExcessNote: totals.showExcessNote,
    signatoryName: signatory.name,
    signatoryDesignation: signatory.designation,
  };

  const pdf = await renderReceiptPdf(props, {
    kind: "booking",
    id: data.booking.id,
    version: String(new Date(data.booking.updatedAt ?? data.booking.createdAt).getTime()),
    signatoryId: signatory.id,
  });

  return { pdf, receiptNo, props };
}

export async function buildSaleReceiptPdf(saleId: string, signatoryId?: string | null) {
  const session = await requireSession();
  assertCan(session.user.role, "sales.read");

  const data = await getSoldDetail(saleId);
  if (!data) throw new NotFoundError("Sale not found");

  if (data.type === "COMPLETED_BOOKING") {
    return buildBookingReceiptPdf(data.data.booking.id, signatoryId);
  }

  const sale = data.data;
  const payments: ReceiptPayment[] = [
    {
      amount: sale.salePrice,
      isVoided: false,
      paidAt: sale.soldAt,
      method: sale.paymentMethod ?? "CASH",
      bank: sale.bank,
      reference: sale.reference || "Full payment",
      chequeNo: sale.chequeNo,
      notes: sale.notes,
    },
  ];

  const signatory = await resolveSignatory(signatoryId);
  const settings = await getCompanySettingsRow();
  const totals = computeReceiptTotals({
    netPrice: sale.salePrice,
    downPayment: sale.salePrice,
    installmentCount: 0,
    payments,
  });
  const receiptNo = await ensureReceiptNo({
    saleId: sale.id,
    signatoryId: signatory.id,
    createdBy: session.user.id,
  });

  const props: DownPaymentReceiptProps = {
    receiptNo,
    printDate: printDateLabel(),
    serialNo: sale.serialNo,
    applicationFormNo: sale.applicationFormNo,
    registrationNo: sale.registrationNo,
    unitCode: formatUnitDisplayCode(sale.unitCode, sale.categoryName),
    floorName: sale.floorName,
    unitType: sale.categoryName,
    netAreaSqft: String(effectivePricingArea(sale.grossAreaSqft, sale.netAreaSqft)),
    ratePerSqftPkr: String(sale.ratePerSqftPkr),
    totalPrice: sale.salePrice,
    installmentType: "Full",
    perInstallment: "0.00",
    bookingNo: sale.applicationFormNo,
    bookingDate: dateLabel(sale.soldAt),
    bookingOffice: sale.bookingOffice || DEFAULT_BOOKING_OFFICE,
    salesAgent: sale.salesAgent || sale.createdByName || "—",
    clientName: sale.clientName,
    relationPrefix: sale.clientRelationPrefix || "S/O",
    relationName: sale.clientRelationName || "",
    clientCnic: sale.clientCnic,
    clientEmail: sale.clientEmail || "—",
    clientPhone: sale.clientPhone,
    clientAddress: sale.homeAddress,
    bankName: settings.bankName,
    accountTitle: settings.accountTitle,
    iban: settings.iban,
    downPaymentLabel: "Full",
    downPaymentRequired: totals.plan.required,
    totalReceived: totals.received,
    balance: totals.balance,
    payments: totals.listed,
    showExcessNote: totals.showExcessNote,
    signatoryName: signatory.name,
    signatoryDesignation: signatory.designation,
  };

  const pdf = await renderReceiptPdf(props, {
    kind: "sale",
    id: sale.id,
    version: String(new Date(sale.soldAt).getTime()),
    signatoryId: signatory.id,
  });

  return { pdf, receiptNo, props };
}
