import { formatDecimal, parseDecimal } from "@/lib/money";
import type { DiscountType, InstallmentType, PaymentPlan } from "@/db/schema/enums";

export const MAX_SALES_DISCOUNT_PERCENT = 10;
export const DEFAULT_DOWN_PAYMENT_PERCENT = "25";
export const DEFAULT_POSSESSION_PERCENT = "15";
export const DEFAULT_BALLOON_PERCENT = "10";

const HUNDRED_RUPEES_PAISA = 10_000n; // Rs 100 in paisa

export interface CalculatedDiscount {
  discountAmountPkr: string;
  effectivePercent: number;
  netPricePkr: string;
  requiresAdmin: boolean;
}

export function resolveChargeAmount(
  basePricePkr: string,
  type: DiscountType | null | undefined,
  value: string | null | undefined,
): { amountPkr: string; effectivePercent: number } {
  const basePaisa = parseDecimal(basePricePkr || "0");
  if (basePaisa <= 0n || !value || value.trim() === "") {
    return { amountPkr: "0.00", effectivePercent: 0 };
  }

  const valPaisa = parseDecimal(value);
  if (valPaisa <= 0n) {
    return { amountPkr: "0.00", effectivePercent: 0 };
  }

  if (type === "PERCENT") {
    const amountPaisa = (basePaisa * valPaisa + 5000n) / 10_000n;
    return {
      amountPkr: formatDecimal(amountPaisa),
      effectivePercent: Math.round((Number(valPaisa) / 100) * 100) / 100,
    };
  }

  const effectivePercent =
    basePaisa > 0n ? Number((valPaisa * 10_000n) / basePaisa) / 100 : 0;
  return {
    amountPkr: formatDecimal(valPaisa),
    effectivePercent: Math.round(effectivePercent * 100) / 100,
  };
}

export function calculateDiscount(
  listPricePkr: string,
  discountType: "AMOUNT" | "PERCENT" | null | undefined,
  discountValue: string | null | undefined,
): CalculatedDiscount {
  const listPaisa = parseDecimal(listPricePkr);
  if (listPaisa <= 0n || !discountType || !discountValue || discountValue.trim() === "") {
    return {
      discountAmountPkr: "0.00",
      effectivePercent: 0,
      netPricePkr: formatDecimal(listPaisa),
      requiresAdmin: false,
    };
  }

  const valPaisa = parseDecimal(discountValue);
  let discountPaisa = 0n;
  let effectivePercent = 0;

  if (discountType === "PERCENT") {
    discountPaisa = (listPaisa * valPaisa + 5000n) / 10_000n;
    if (discountPaisa > listPaisa) {
      discountPaisa = listPaisa;
    }
    effectivePercent = Number(valPaisa) / 100;
  } else {
    discountPaisa = valPaisa > listPaisa ? listPaisa : valPaisa;
    effectivePercent =
      listPaisa > 0n ? Number((discountPaisa * 10_000n) / listPaisa) / 100 : 0;
  }

  const netPaisa = listPaisa - discountPaisa;
  const requiresAdmin = effectivePercent > MAX_SALES_DISCOUNT_PERCENT;

  return {
    discountAmountPkr: formatDecimal(discountPaisa),
    effectivePercent: Math.round(effectivePercent * 100) / 100,
    netPricePkr: formatDecimal(netPaisa),
    requiresAdmin,
  };
}

export interface InstallmentDraft {
  seq: number;
  type: InstallmentType;
  label: string;
  dueDate: Date;
  amountPkr: string;
}

export interface PaymentSchedule {
  listPricePkr: string;
  discountAmountPkr: string;
  netPricePkr: string;
  downPaymentPkr: string;
  downPaymentPercent: number;
  tokenAdjustedPkr: string;
  payableDownPaymentNowPkr: string;
  possessionAmountPkr: string;
  possessionPercent: number;
  balloonAmountPerYearPkr: string;
  balloonPercentPerYear: number;
  balloonPercent: number;
  balloonCount: number;
  balloonTotalAmountPkr: string;
  totalInstallmentsPkr: string;
  installmentCount: number;
  paidPercent: number;
  remainingBalancePkr: string;
  isValid: boolean;
  validationError: string | null;
  installments: InstallmentDraft[];
}

function addMonths(baseDate: Date, monthsToAdd: number): Date {
  const d = new Date(baseDate.getTime());
  const targetMonth = d.getMonth() + monthsToAdd;
  d.setMonth(targetMonth);
  return d;
}

export function planIntervalMonths(plan: PaymentPlan): number {
  switch (plan) {
    case "MONTHLY":
      return 1;
    case "QUARTERLY":
      return 3;
    case "SEMI_ANNUAL":
      return 6;
    default:
      return 1;
  }
}

/**
 * Generates an installment payment schedule with:
 * - Down Payment (% or fixed PKR) with optional Token adjustment
 * - Annual Balloon Payments (Total % or fixed PKR, divided equally across full 12-month years in plan)
 * - Possession Payment (% or fixed PKR, added as final possession milestone)
 * - Regular Installments (rounded to nearest Rs 100 with exact paisa remainder on last regular installment)
 *
 * Guarantees exact paisa invariant:
 *   downPayment + sum(REGULAR) + sum(BALLOON) + POSSESSION === netPrice
 */
export function generateSchedule(params: {
  listPricePkr: string;
  discountType?: "AMOUNT" | "PERCENT" | null;
  discountValue?: string | null;
  downPaymentType?: DiscountType | null;
  downPaymentValue?: string | null;
  downPaymentPkr?: string;
  possessionType?: DiscountType | null;
  possessionValue?: string | null;
  possessionAmountPkr?: string | null;
  balloonType?: DiscountType | null;
  balloonValue?: string | null;
  tokenAdjustedPkr?: string | null;
  plan: PaymentPlan;
  installmentCount: number;
  startDate: Date;
}): PaymentSchedule {
  const { netPricePkr, discountAmountPkr } = calculateDiscount(
    params.listPricePkr,
    params.discountType,
    params.discountValue,
  );

  const netPaisa = parseDecimal(netPricePkr);

  // Down payment (% or fixed PKR)
  const downResolved =
    params.downPaymentType && params.downPaymentValue !== undefined
      ? resolveChargeAmount(netPricePkr, params.downPaymentType, params.downPaymentValue)
      : resolveChargeAmount(netPricePkr, "AMOUNT", params.downPaymentPkr || "0");
  const downPaisa = parseDecimal(downResolved.amountPkr);

  // Token adjustment deducted from down payment payable now
  const rawTokenPaisa = parseDecimal(params.tokenAdjustedPkr || "0");
  const tokenAdjustedPaisa =
    rawTokenPaisa > 0n ? (rawTokenPaisa > downPaisa ? downPaisa : rawTokenPaisa) : 0n;
  const payableDownPaymentNowPaisa = downPaisa - tokenAdjustedPaisa;

  // Possession payment (% or fixed PKR)
  const possessionResolved =
    params.possessionType && params.possessionValue !== undefined
      ? resolveChargeAmount(netPricePkr, params.possessionType, params.possessionValue)
      : resolveChargeAmount(netPricePkr, "AMOUNT", params.possessionAmountPkr || "0");
  const possessionPaisa = parseDecimal(possessionResolved.amountPkr);

  const count = Math.max(1, params.installmentCount);
  const intervalMonths = planIntervalMonths(params.plan);
  const totalPlanMonths = count * intervalMonths;

  // Balloon payments: total balloon allocation across plan, divided equally among full 12-month years
  const balloonResolved =
    params.balloonType && params.balloonValue !== undefined
      ? resolveChargeAmount(netPricePkr, params.balloonType, params.balloonValue)
      : { amountPkr: "0.00", effectivePercent: 0 };
  const rawBalloonTotalPaisa = parseDecimal(balloonResolved.amountPkr);
  const balloonCount = rawBalloonTotalPaisa > 0n ? Math.floor(totalPlanMonths / 12) : 0;
  const balloonTotalPaisa = balloonCount > 0 ? rawBalloonTotalPaisa : 0n;
  const balloonPerYearPaisa =
    balloonCount > 0 ? balloonTotalPaisa / BigInt(balloonCount) : 0n;

  const fixedComponentsPaisa = downPaisa + possessionPaisa + balloonTotalPaisa;
  let isValid = true;
  let validationError: string | null = null;

  if (fixedComponentsPaisa > netPaisa) {
    isValid = false;
    validationError =
      "Down payment, annual balloon payments, and possession amount exceed the net price.";
  }

  const regularBalancePaisa = netPaisa - fixedComponentsPaisa;
  const rawEntries: Array<{
    type: InstallmentType;
    label: string;
    dueDate: Date;
    amountPaisa: bigint;
    sortOrder: number;
  }> = [];

  if (regularBalancePaisa > 0n) {
    const rawInst = regularBalancePaisa / BigInt(count);
    let roundedInst = ((rawInst + 5000n) / HUNDRED_RUPEES_PAISA) * HUNDRED_RUPEES_PAISA;
    if (roundedInst === 0n && regularBalancePaisa > 0n) {
      roundedInst =
        regularBalancePaisa < HUNDRED_RUPEES_PAISA
          ? regularBalancePaisa
          : HUNDRED_RUPEES_PAISA;
    }

    let allocatedTotal = 0n;
    for (let i = 1; i <= count; i++) {
      const dueDate = addMonths(params.startDate, (i - 1) * intervalMonths);
      let instAmount = roundedInst;

      if (i === count) {
        instAmount = regularBalancePaisa - allocatedTotal;
      } else {
        if (allocatedTotal + instAmount > regularBalancePaisa) {
          instAmount = regularBalancePaisa - allocatedTotal;
        }
        allocatedTotal += instAmount;
      }

      rawEntries.push({
        type: "REGULAR",
        label: `Installment #${i}`,
        dueDate,
        amountPaisa: instAmount,
        sortOrder: 0,
      });
    }
  } else if (balloonCount === 0 && possessionPaisa === 0n) {
    // Fully paid by down payment — preserve single 0.00 entry for backwards compatibility
    rawEntries.push({
      type: "REGULAR",
      label: "Installment #1",
      dueDate: new Date(params.startDate.getTime()),
      amountPaisa: 0n,
      sortOrder: 0,
    });
  }

  // Annual balloon schedule rows (Year 1 at month 12, Year 2 at month 24, ...)
  let allocatedBalloonPaisa = 0n;
  for (let year = 1; year <= balloonCount; year++) {
    const dueDate = addMonths(params.startDate, year * 12 - 1);
    const amountPaisa =
      year === balloonCount
        ? balloonTotalPaisa - allocatedBalloonPaisa
        : balloonPerYearPaisa;
    allocatedBalloonPaisa += amountPaisa;
    rawEntries.push({
      type: "BALLOON",
      label: `Year ${year} Balloon Payment`,
      dueDate,
      amountPaisa,
      sortOrder: 1,
    });
  }

  // Possession milestone row (if > 0 and caller is using full schedule mode)
  if (possessionPaisa > 0n && params.possessionType !== undefined) {
    const possessionDueDate = addMonths(params.startDate, totalPlanMonths);
    rawEntries.push({
      type: "POSSESSION",
      label: "Possession Payment",
      dueDate: possessionDueDate,
      amountPaisa: possessionPaisa,
      sortOrder: 2,
    });
  }

  // Chronological sort (regular before balloon on same date, possession last)
  rawEntries.sort((a, b) => {
    if (a.type === "POSSESSION" && b.type !== "POSSESSION") return 1;
    if (b.type === "POSSESSION" && a.type !== "POSSESSION") return -1;
    const dt = a.dueDate.getTime() - b.dueDate.getTime();
    if (dt !== 0) return dt;
    return a.sortOrder - b.sortOrder;
  });

  const installments: InstallmentDraft[] = rawEntries.map((entry, idx) => ({
    seq: idx + 1,
    type: entry.type,
    label: entry.label,
    dueDate: entry.dueDate,
    amountPkr: formatDecimal(entry.amountPaisa),
  }));

  const paidPercent =
    netPaisa > 0n
      ? Math.min(100, Math.round(Number((downPaisa * 10_000n) / netPaisa) / 100))
      : 0;

  const remainingBalancePaisa = netPaisa - downPaisa;

  return {
    listPricePkr: params.listPricePkr,
    discountAmountPkr,
    netPricePkr,
    downPaymentPkr: formatDecimal(downPaisa),
    downPaymentPercent: downResolved.effectivePercent,
    tokenAdjustedPkr: formatDecimal(tokenAdjustedPaisa),
    payableDownPaymentNowPkr: formatDecimal(payableDownPaymentNowPaisa),
    possessionAmountPkr: formatDecimal(possessionPaisa),
    possessionPercent: possessionResolved.effectivePercent,
    balloonAmountPerYearPkr: formatDecimal(balloonPerYearPaisa),
    balloonPercentPerYear:
      balloonCount > 0
        ? Math.round((balloonResolved.effectivePercent / balloonCount) * 100) / 100
        : 0,
    balloonPercent: balloonResolved.effectivePercent,
    balloonCount,
    balloonTotalAmountPkr: formatDecimal(balloonTotalPaisa),
    totalInstallmentsPkr: formatDecimal(
      regularBalancePaisa > 0n ? regularBalancePaisa : 0n,
    ),
    installmentCount: count,
    paidPercent,
    remainingBalancePkr: formatDecimal(
      remainingBalancePaisa > 0n ? remainingBalancePaisa : 0n,
    ),
    isValid,
    validationError,
    installments,
  };
}

export interface InstallmentAllocation {
  installmentId: string;
  seq: number;
  type?: InstallmentType;
  dueDate: Date;
  amountPkr: string;
  previousPaidPkr: string;
  allocatedPkr: string;
  newPaidPkr: string;
  newStatus: "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" | "CANCELLED";
}

export interface PaymentAllocationResult {
  allocations: InstallmentAllocation[];
  unallocatedPkr: string;
  newPaidTotalPkr: string;
  isCompleted: boolean;
}

/**
 * Allocates a payment amount to the oldest unpaid installments.
 */
export function allocatePayment(params: {
  paymentAmountPkr: string;
  currentPaidTotalPkr: string;
  netPricePkr: string;
  installments: Array<{
    id: string;
    seq: number;
    type?: InstallmentType;
    dueDate: Date;
    amount: string;
    paidAmount: string;
    status: "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" | "CANCELLED";
  }>;
}): PaymentAllocationResult {
  let remainingPaisa = parseDecimal(params.paymentAmountPkr);
  const now = new Date();

  const sorted = [...params.installments]
    .filter((inst) => inst.status !== "CANCELLED")
    .sort((a, b) => a.seq - b.seq);

  const allocations: InstallmentAllocation[] = [];

  for (const inst of sorted) {
    const instAmountPaisa = parseDecimal(inst.amount);
    const prevPaidPaisa = parseDecimal(inst.paidAmount);
    const neededPaisa = instAmountPaisa - prevPaidPaisa;

    if (neededPaisa <= 0n) {
      continue;
    }

    if (remainingPaisa <= 0n) {
      break;
    }

    const allocatedPaisa = remainingPaisa < neededPaisa ? remainingPaisa : neededPaisa;
    const newPaidPaisa = prevPaidPaisa + allocatedPaisa;
    remainingPaisa -= allocatedPaisa;

    let newStatus: "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" | "CANCELLED";
    if (newPaidPaisa >= instAmountPaisa) {
      newStatus = "PAID";
    } else if (newPaidPaisa > 0n) {
      newStatus = "PARTIAL";
    } else {
      newStatus = inst.dueDate < now ? "OVERDUE" : "PENDING";
    }

    allocations.push({
      installmentId: inst.id,
      seq: inst.seq,
      type: inst.type,
      dueDate: inst.dueDate,
      amountPkr: inst.amount,
      previousPaidPkr: inst.paidAmount,
      allocatedPkr: formatDecimal(allocatedPaisa),
      newPaidPkr: formatDecimal(newPaidPaisa),
      newStatus,
    });
  }

  const prevPaidTotalPaisa = parseDecimal(params.currentPaidTotalPkr);
  const paymentPaisa = parseDecimal(params.paymentAmountPkr);
  const netPricePaisa = parseDecimal(params.netPricePkr);
  const newPaidTotalPaisa = prevPaidTotalPaisa + paymentPaisa;

  return {
    allocations,
    unallocatedPkr: formatDecimal(remainingPaisa),
    newPaidTotalPkr: formatDecimal(newPaidTotalPaisa),
    isCompleted: newPaidTotalPaisa >= netPricePaisa,
  };
}

export function calculateRefund(params: {
  paidTotalPkr: string;
  deductionType: "AMOUNT" | "PERCENT";
  deductionValue: string;
}): { deductionPkr: string; refundAmountPkr: string } {
  const paidPaisa = parseDecimal(params.paidTotalPkr);
  const valPaisa = parseDecimal(params.deductionValue || "0");

  let deductionPaisa = 0n;
  if (params.deductionType === "PERCENT") {
    deductionPaisa = (paidPaisa * valPaisa + 5000n) / 10_000n;
  } else {
    deductionPaisa = valPaisa;
  }

  if (deductionPaisa > paidPaisa) {
    deductionPaisa = paidPaisa;
  }

  const refundPaisa = paidPaisa - deductionPaisa;

  return {
    deductionPkr: formatDecimal(deductionPaisa),
    refundAmountPkr: formatDecimal(refundPaisa),
  };
}

export function calculateBuyback(params: {
  originalPricePkr: string;
  buybackAmountPkr: string;
}): {
  originalPricePkr: string;
  buybackAmountPkr: string;
  differencePkr: string;
  isGain: boolean;
} {
  const origPaisa = parseDecimal(params.originalPricePkr);
  const buybackPaisa = parseDecimal(params.buybackAmountPkr);
  const diffPaisa = origPaisa - buybackPaisa;

  return {
    originalPricePkr: formatDecimal(origPaisa),
    buybackAmountPkr: formatDecimal(buybackPaisa),
    differencePkr: formatDecimal(diffPaisa < 0n ? -diffPaisa : diffPaisa),
    isGain: diffPaisa >= 0n,
  };
}
