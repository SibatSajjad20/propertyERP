import { sql } from "drizzle-orm";
import { db } from "@/db";
import { bookings, documentCounters, payments, reservations } from "@/db/schema/sales";

export const DOCUMENT_COUNTER_KEY = "FORM";
export const RECEIPT_COUNTER_KEY = "receipt";
export const PAYMENT_RECEIPT_COUNTER_KEY = "REC";
export const BOOKING_COUNTER_KEY = "BOOKING";
export const TOKEN_COUNTER_KEY = "TOKEN";

export type DocumentNumbers = {
  serialNo: number;
  applicationFormNo: string;
  registrationNo: string;
};

export function splitUnitCode(unitCode: string): {
  floorCode: string;
  unitShort: string;
} {
  const trimmed = unitCode.trim();
  const dash = trimmed.indexOf("-");
  if (dash <= 0 || dash === trimmed.length - 1) {
    return { floorCode: trimmed || "X", unitShort: trimmed || "X" };
  }
  return {
    floorCode: trimmed.slice(0, dash),
    unitShort: trimmed.slice(dash + 1),
  };
}

export function padSerial(serialNo: number): string {
  return String(serialNo).padStart(3, "0");
}

export function formatDocumentNumbers(
  unitCode: string,
  date: Date,
  serialNo: number,
): DocumentNumbers {
  const { floorCode, unitShort } = splitUnitCode(unitCode);
  const yy = String(date.getFullYear()).slice(-2);
  const serial = padSerial(serialNo);
  return {
    serialNo,
    applicationFormNo: `SM-${floorCode}-${unitShort}-${yy}-${serial}`,
    registrationNo: `ASSH-${floorCode}-${unitShort}-${yy}-SM${serial}`,
  };
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function allocateDocumentNumbers(
  tx: Tx,
  unitCode: string,
  date: Date,
): Promise<DocumentNumbers> {
  const year = date.getFullYear();
  const [maxRow] = await tx
    .select({
      maxSerial: sql<number>`GREATEST(
        COALESCE((SELECT MAX(serial_no) FROM bookings WHERE EXTRACT(YEAR FROM created_at) = ${year}), 0),
        COALESCE((SELECT MAX(serial_no) FROM sales WHERE EXTRACT(YEAR FROM created_at) = ${year}), 0)
      )::int`,
    })
    .from(sql`(SELECT 1) AS _t`);
  const existingMax = Number(maxRow?.maxSerial ?? 0);

  const [row] = await tx
    .insert(documentCounters)
    .values({ key: DOCUMENT_COUNTER_KEY, year, lastValue: existingMax + 1 })
    .onConflictDoUpdate({
      target: [documentCounters.key, documentCounters.year],
      set: {
        lastValue: sql`GREATEST(${documentCounters.lastValue}, ${existingMax}) + 1`,
      },
    })
    .returning({ lastValue: documentCounters.lastValue });

  const next = row?.lastValue ?? existingMax + 1;
  return formatDocumentNumbers(unitCode, date, next);
}

export function padReceiptSerial(serialNo: number): string {
  return String(serialNo).padStart(4, "0");
}

export function formatReceiptNo(date: Date, serialNo: number): string {
  const yy = String(date.getFullYear()).slice(-2);
  return `SM-DPR-${yy}-${padReceiptSerial(serialNo)}`;
}

export async function allocateReceiptNumber(tx: Tx, date: Date): Promise<string> {
  const year = date.getFullYear();
  const [row] = await tx
    .insert(documentCounters)
    .values({ key: RECEIPT_COUNTER_KEY, year, lastValue: 1 })
    .onConflictDoUpdate({
      target: [documentCounters.key, documentCounters.year],
      set: { lastValue: sql`${documentCounters.lastValue} + 1` },
    })
    .returning({ lastValue: documentCounters.lastValue });

  const next = row?.lastValue ?? 1;
  return formatReceiptNo(date, next);
}

export async function allocatePaymentReceiptNumber(tx: Tx, date: Date): Promise<string> {
  const year = date.getFullYear();
  const prefix = `SM-REC-${year}-`;
  const [maxRow] = await tx
    .select({
      maxSeq: sql<number>`COALESCE(MAX(CASE WHEN SUBSTR(${payments.receiptNo}, ${prefix.length + 1}) ~ '^[0-9]+$' THEN SUBSTR(${payments.receiptNo}, ${prefix.length + 1})::int ELSE 0 END), 0)::int`,
    })
    .from(payments)
    .where(sql`${payments.receiptNo} LIKE ${prefix + "%"}`);
  const existingMax = Number(maxRow?.maxSeq ?? 0);

  const [row] = await tx
    .insert(documentCounters)
    .values({ key: PAYMENT_RECEIPT_COUNTER_KEY, year, lastValue: existingMax + 1 })
    .onConflictDoUpdate({
      target: [documentCounters.key, documentCounters.year],
      set: {
        lastValue: sql`GREATEST(${documentCounters.lastValue}, ${existingMax}) + 1`,
      },
    })
    .returning({ lastValue: documentCounters.lastValue });

  const next = row?.lastValue ?? existingMax + 1;
  const seq = String(next).padStart(4, "0");
  return `${prefix}${seq}`;
}

export async function allocateBookingNumber(tx: Tx, date: Date): Promise<string> {
  const year = date.getFullYear();
  const prefix = `SM-BK-${year}-`;
  const [maxRow] = await tx
    .select({
      maxSeq: sql<number>`COALESCE(MAX(CASE WHEN SUBSTR(${bookings.bookingNo}, ${prefix.length + 1}) ~ '^[0-9]+$' THEN SUBSTR(${bookings.bookingNo}, ${prefix.length + 1})::int ELSE 0 END), 0)::int`,
    })
    .from(bookings)
    .where(sql`${bookings.bookingNo} LIKE ${prefix + "%"}`);
  const existingMax = Number(maxRow?.maxSeq ?? 0);

  const [row] = await tx
    .insert(documentCounters)
    .values({ key: BOOKING_COUNTER_KEY, year, lastValue: existingMax + 1 })
    .onConflictDoUpdate({
      target: [documentCounters.key, documentCounters.year],
      set: {
        lastValue: sql`GREATEST(${documentCounters.lastValue}, ${existingMax}) + 1`,
      },
    })
    .returning({ lastValue: documentCounters.lastValue });

  const next = row?.lastValue ?? existingMax + 1;
  const seq = String(next).padStart(4, "0");
  return `${prefix}${seq}`;
}

export async function allocateTokenReceiptNumber(tx: Tx, date: Date): Promise<string> {
  const year = date.getFullYear();
  const prefix = `SM-TOK-${year}-`;
  const [maxRow] = await tx
    .select({
      maxSeq: sql<number>`COALESCE(MAX(CASE WHEN SUBSTR(${reservations.tokenReceiptNo}, ${prefix.length + 1}) ~ '^[0-9]+$' THEN SUBSTR(${reservations.tokenReceiptNo}, ${prefix.length + 1})::int ELSE 0 END), 0)::int`,
    })
    .from(reservations)
    .where(sql`${reservations.tokenReceiptNo} LIKE ${prefix + "%"}`);
  const existingMax = Number(maxRow?.maxSeq ?? 0);

  const [row] = await tx
    .insert(documentCounters)
    .values({ key: TOKEN_COUNTER_KEY, year, lastValue: existingMax + 1 })
    .onConflictDoUpdate({
      target: [documentCounters.key, documentCounters.year],
      set: {
        lastValue: sql`GREATEST(${documentCounters.lastValue}, ${existingMax}) + 1`,
      },
    })
    .returning({ lastValue: documentCounters.lastValue });

  const next = row?.lastValue ?? existingMax + 1;
  const seq = String(next).padStart(4, "0");
  return `${prefix}${seq}`;
}
