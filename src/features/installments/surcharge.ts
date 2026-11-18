import { formatDecimal, parseDecimal } from "@/lib/money";

export const SURCHARGE_GRACE_DAYS = 30;
export const SURCHARGE_DAILY_PERCENT = 0.1; // 0.1% per overdue day beyond grace period

const MS_PER_DAY = 86_400_000;

function utcDayTimestamp(date: Date | string): number {
  const d = date instanceof Date ? date : new Date(date);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function divRoundHalfUp(numerator: bigint, denominator: bigint): bigint {
  const quotient = numerator / denominator;
  const remainder = numerator % denominator;
  return remainder * 2n >= denominator ? quotient + 1n : quotient;
}

export interface SurchargeInput {
  amount: string;
  paidAmount: string;
  dueDate: Date | string;
  status: "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" | "CANCELLED";
  surchargeWaived?: boolean;
  surchargeWaivedAmount?: string | null;
  surchargePaidAmount?: string | null;
  bookingSurchargeExempt?: boolean;
}

export interface SurchargeBreakdown {
  daysPastDue: number;
  chargeableDays: number;
  unpaidPrincipalPkr: string;
  rawAccruedPkr: string;
  waivedPkr: string;
  paidPkr: string;
  netDuePkr: string;
  isExemptOrWaived: boolean;
}

/**
 * Automatic Surcharge Policy:
 * - Grace period: 30 days after due date (no surcharge on days 1..30)
 * - Rate: 0.1% per overdue day beyond the 30-day grace period
 * - Chargeable Days = max(0, daysPastDue - 30)
 * - Surcharge = Overdue Unpaid Principal × 0.1% × Chargeable Days
 * - Respects booking-level Surcharge Exemption and installment-level Waive/Remove Policy.
 */
export function calculateInstallmentSurcharge(
  input: SurchargeInput,
  asOfDate: Date = new Date(),
): SurchargeBreakdown {
  const amountPaisa = parseDecimal(input.amount || "0");
  const paidPaisa = parseDecimal(input.paidAmount || "0");
  const unpaidPaisa = amountPaisa > paidPaisa ? amountPaisa - paidPaisa : 0n;
  const paidSurchargePaisa = parseDecimal(input.surchargePaidAmount || "0");

  if (input.status === "PAID" || input.status === "CANCELLED" || unpaidPaisa <= 0n) {
    return {
      daysPastDue: 0,
      chargeableDays: 0,
      unpaidPrincipalPkr: "0.00",
      rawAccruedPkr: "0.00",
      waivedPkr: formatDecimal(parseDecimal(input.surchargeWaivedAmount || "0")),
      paidPkr: formatDecimal(paidSurchargePaisa),
      netDuePkr: "0.00",
      isExemptOrWaived: Boolean(input.bookingSurchargeExempt || input.surchargeWaived),
    };
  }

  const diffMs = utcDayTimestamp(asOfDate) - utcDayTimestamp(input.dueDate);
  const daysPastDue = Math.max(0, Math.floor(diffMs / MS_PER_DAY));
  const chargeableDays = Math.max(0, daysPastDue - SURCHARGE_GRACE_DAYS);

  // 0.1% = 1 / 1000
  const rawAccruedPaisa =
    chargeableDays > 0 ? divRoundHalfUp(unpaidPaisa * BigInt(chargeableDays), 1000n) : 0n;

  const isExemptOrWaived = Boolean(input.bookingSurchargeExempt || input.surchargeWaived);

  if (isExemptOrWaived) {
    return {
      daysPastDue,
      chargeableDays,
      unpaidPrincipalPkr: formatDecimal(unpaidPaisa),
      rawAccruedPkr: formatDecimal(rawAccruedPaisa),
      waivedPkr: formatDecimal(rawAccruedPaisa),
      paidPkr: formatDecimal(paidSurchargePaisa),
      netDuePkr: "0.00",
      isExemptOrWaived: true,
    };
  }

  const explicitWaivedPaisa = parseDecimal(input.surchargeWaivedAmount || "0");
  const effectiveWaivedPaisa =
    explicitWaivedPaisa > rawAccruedPaisa ? rawAccruedPaisa : explicitWaivedPaisa;

  const remainingAfterWaiver = rawAccruedPaisa - effectiveWaivedPaisa;
  const netDuePaisa =
    remainingAfterWaiver > paidSurchargePaisa
      ? remainingAfterWaiver - paidSurchargePaisa
      : 0n;

  return {
    daysPastDue,
    chargeableDays,
    unpaidPrincipalPkr: formatDecimal(unpaidPaisa),
    rawAccruedPkr: formatDecimal(rawAccruedPaisa),
    waivedPkr: formatDecimal(effectiveWaivedPaisa),
    paidPkr: formatDecimal(paidSurchargePaisa),
    netDuePkr: formatDecimal(netDuePaisa),
    isExemptOrWaived: false,
  };
}

export function summarizeBookingSurcharges(
  installments: SurchargeInput[],
  bookingSurchargeExempt = false,
  asOfDate: Date = new Date(),
): {
  totalRawAccruedPkr: string;
  totalWaivedPkr: string;
  totalPaidPkr: string;
  totalNetDuePkr: string;
  overdueWithSurchargeCount: number;
} {
  let rawTotal = 0n;
  let waivedTotal = 0n;
  let paidTotal = 0n;
  let netDueTotal = 0n;
  let overdueWithSurchargeCount = 0;

  for (const inst of installments) {
    const s = calculateInstallmentSurcharge(
      { ...inst, bookingSurchargeExempt },
      asOfDate,
    );
    rawTotal += parseDecimal(s.rawAccruedPkr);
    waivedTotal += parseDecimal(s.waivedPkr);
    paidTotal += parseDecimal(s.paidPkr);
    const due = parseDecimal(s.netDuePkr);
    netDueTotal += due;
    if (due > 0n) {
      overdueWithSurchargeCount++;
    }
  }

  return {
    totalRawAccruedPkr: formatDecimal(rawTotal),
    totalWaivedPkr: formatDecimal(waivedTotal),
    totalPaidPkr: formatDecimal(paidTotal),
    totalNetDuePkr: formatDecimal(netDueTotal),
    overdueWithSurchargeCount,
  };
}
