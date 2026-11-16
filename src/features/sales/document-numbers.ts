import { sql } from "drizzle-orm";
import { db } from "@/db";
import { documentCounters } from "@/db/schema/sales";

export const DOCUMENT_COUNTER_KEY = "FORM";
export const RECEIPT_COUNTER_KEY = "receipt";

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
  const [row] = await tx
    .insert(documentCounters)
    .values({ key: DOCUMENT_COUNTER_KEY, year, lastValue: 1 })
    .onConflictDoUpdate({
      target: [documentCounters.key, documentCounters.year],
      set: { lastValue: sql`${documentCounters.lastValue} + 1` },
    })
    .returning({ lastValue: documentCounters.lastValue });

  const next = row?.lastValue ?? 1;
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
