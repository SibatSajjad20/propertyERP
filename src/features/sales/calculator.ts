/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { formatDecimal, parseDecimal } from "@/lib/money";
import type { PaymentPlan } from "@/db/schema/enums";

export const MAX_SALES_DISCOUNT_PERCENT = 10;
const PAISA_SCALE = 100n;
const HUNDRED_RUPEES_PAISA = 10_000n; // Rs 100 in paisa

export interface CalculatedDiscount {
  discountAmountPkr: string;
  effectivePercent: number;
  netPricePkr: string;
  requiresAdmin: boolean;
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
    // discountValue is percent with up to 2 decimal places (e.g. 5.00)
    // valPaisa = 500n for 5%
    // discountPaisa = round(listPaisa * valPaisa / 10000n)
    discountPaisa = (listPaisa * valPaisa + 5000n) / 10_000n;
    if (discountPaisa > listPaisa) {
      discountPaisa = listPaisa;
    }
    effectivePercent = Number(valPaisa) / 100;
  } else {
    // discountType === "AMOUNT"
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
  dueDate: Date;
  amountPkr: string;
}

export interface PaymentSchedule {
  listPricePkr: string;
  discountAmountPkr: string;
  netPricePkr: string;
  downPaymentPkr: string;
  possessionAmountPkr: string;
  totalInstallmentsPkr: string;
  installmentCount: number;
  paidPercent: number;
  remainingBalancePkr: string;
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
 * Generates an installment payment schedule.
 * Rounding: rounds each installment to nearest Rs 100, and puts any remainder on the last installment.
 * Guarantees downPayment + sum(installments) + possessionAmount = netPrice.
 */
export function generateSchedule(params: {
  listPricePkr: string;
  discountType?: "AMOUNT" | "PERCENT" | null;
  discountValue?: string | null;
  downPaymentPkr: string;
  possessionAmountPkr?: string | null;
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
  const downPaisa = parseDecimal(params.downPaymentPkr || "0");
  const possessionPaisa = parseDecimal(params.possessionAmountPkr || "0");
  const count = Math.max(1, params.installmentCount);

  const balancePaisa = netPaisa - downPaisa - possessionPaisa;
  const installments: InstallmentDraft[] = [];

  const intervalMonths = planIntervalMonths(params.plan);

  if (balancePaisa <= 0n) {
    // Fully paid by down payment / possession
    installments.push({
      seq: 1,
      dueDate: new Date(params.startDate.getTime()),
      amountPkr: "0.00",
    });
  } else {
    // Unrounded installment amount
    const rawInst = balancePaisa / BigInt(count);
    // Round to nearest Rs 100 (10,000 paisa)
    let roundedInst = ((rawInst + 5000n) / HUNDRED_RUPEES_PAISA) * HUNDRED_RUPEES_PAISA;
    if (roundedInst === 0n && balancePaisa > 0n) {
      roundedInst =
        balancePaisa < HUNDRED_RUPEES_PAISA ? balancePaisa : HUNDRED_RUPEES_PAISA;
    }

    let allocatedTotal = 0n;

    for (let i = 1; i <= count; i++) {
      const dueDate = addMonths(params.startDate, (i - 1) * intervalMonths);
      let instAmount = roundedInst;

      if (i === count) {
        // Last installment gets the remainder
        instAmount = balancePaisa - allocatedTotal;
      } else {
        // Guard against overshoot if count * roundedInst > balance
        if (allocatedTotal + instAmount > balancePaisa) {
          instAmount = balancePaisa - allocatedTotal;
        }
        allocatedTotal += instAmount;
      }

      installments.push({
        seq: i,
        dueDate,
        amountPkr: formatDecimal(instAmount),
      });
    }
  }

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
    possessionAmountPkr: formatDecimal(possessionPaisa),
    totalInstallmentsPkr: formatDecimal(balancePaisa > 0n ? balancePaisa : 0n),
    installmentCount: count,
    paidPercent,
    remainingBalancePkr: formatDecimal(
      remainingBalancePaisa > 0n ? remainingBalancePaisa : 0n,
    ),
    installments,
  };
}

export interface InstallmentAllocation {
  installmentId: string;
  seq: number;
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
    dueDate: Date;
    amount: string;
    paidAmount: string;
    status: "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" | "CANCELLED";
  }>;
}): PaymentAllocationResult {
  let remainingPaisa = parseDecimal(params.paymentAmountPkr);
  const now = new Date();

  // Sort installments by sequence ascending
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
