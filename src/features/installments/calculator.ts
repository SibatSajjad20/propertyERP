import { formatDecimal, parseDecimal } from "@/lib/money";

export interface RecalculateAllocationsParams {
  booking: {
    id: string;
    netPrice: string;
    downPayment: string;
  };
  installments: Array<{
    id: string;
    seq: number;
    dueDate: Date;
    amount: string;
    paidAmount?: string;
    status?: "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" | "CANCELLED";
    receiptNos?: string | null;
  }>;
  payments: Array<{
    id: string;
    receiptNo: string;
    amount: string;
    isVoided: boolean;
    paidAt: Date;
    notes?: string | null;
  }>;
  asOfDate?: Date;
}

export interface RecalculatedInstallment {
  id: string;
  seq: number;
  dueDate: Date;
  amount: string;
  paidAmount: string;
  status: "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" | "CANCELLED";
  receiptNos: string | null;
}

export interface RecalculateAllocationsResult {
  paidTotalPkr: string;
  isCompleted: boolean;
  installments: RecalculatedInstallment[];
}

/**
 * Recomputes payment allocations across installments for a booking.
 * Non-voided payments first cover the booking's down payment.
 * Any remaining funds are allocated waterfall to active installments in sequence order.
 */
export function recalculateInstallmentAllocations({
  booking,
  installments,
  payments,
  asOfDate = new Date(),
}: RecalculateAllocationsParams): RecalculateAllocationsResult {
  const activePayments = [...payments]
    .filter((p) => !p.isVoided)
    .sort((a, b) => new Date(a.paidAt).getTime() - new Date(b.paidAt).getTime());

  // Total paid across all non-voided payments
  let totalPaidPaisa = 0n;
  for (const p of activePayments) {
    totalPaidPaisa += parseDecimal(p.amount);
  }

  const netPricePaisa = parseDecimal(booking.netPrice);
  const downPaymentPaisa = parseDecimal(booking.downPayment || "0");

  // Track installment allocations and receipt numbers
  const sortedInst = [...installments].sort((a, b) => a.seq - b.seq);
  const resultInstallments: RecalculatedInstallment[] = [];

  // Group receipts by the non-downpayment payments that provide funds
  // To assign receipt numbers precisely, we waterfall payment by payment through the installments
  const activeNonDownPayments: Array<{ receiptNo: string; remainingPaisa: bigint }> = [];

  let downCoverageLeft = downPaymentPaisa;
  for (const p of activePayments) {
    const pPaisa = parseDecimal(p.amount);
    if (downCoverageLeft > 0n) {
      if (pPaisa <= downCoverageLeft) {
        downCoverageLeft -= pPaisa;
        continue;
      } else {
        const excess = pPaisa - downCoverageLeft;
        downCoverageLeft = 0n;
        activeNonDownPayments.push({ receiptNo: p.receiptNo, remainingPaisa: excess });
      }
    } else {
      activeNonDownPayments.push({ receiptNo: p.receiptNo, remainingPaisa: pPaisa });
    }
  }

  let paymentIdx = 0;

  for (const inst of sortedInst) {
    if (inst.status === "CANCELLED") {
      resultInstallments.push({
        id: inst.id,
        seq: inst.seq,
        dueDate: inst.dueDate,
        amount: inst.amount,
        paidAmount: "0.00",
        status: "CANCELLED",
        receiptNos: null,
      });
      continue;
    }

    const instAmountPaisa = parseDecimal(inst.amount);
    let instPaidPaisa = 0n;
    const contributingReceipts: string[] = [];

    while (paymentIdx < activeNonDownPayments.length && instPaidPaisa < instAmountPaisa) {
      const curPayment = activeNonDownPayments[paymentIdx]!;
      if (curPayment.remainingPaisa <= 0n) {
        paymentIdx++;
        continue;
      }

      const needed = instAmountPaisa - instPaidPaisa;
      const take =
        curPayment.remainingPaisa < needed ? curPayment.remainingPaisa : needed;

      instPaidPaisa += take;
      curPayment.remainingPaisa -= take;

      if (!contributingReceipts.includes(curPayment.receiptNo)) {
        contributingReceipts.push(curPayment.receiptNo);
      }

      if (curPayment.remainingPaisa === 0n) {
        paymentIdx++;
      }
    }

    let status: "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" = "PENDING";
    if (instPaidPaisa >= instAmountPaisa && instAmountPaisa > 0n) {
      status = "PAID";
    } else if (instPaidPaisa > 0n) {
      status = "PARTIAL";
    } else {
      status =
        new Date(inst.dueDate).getTime() < asOfDate.getTime() ? "OVERDUE" : "PENDING";
    }

    resultInstallments.push({
      id: inst.id,
      seq: inst.seq,
      dueDate: inst.dueDate,
      amount: inst.amount,
      paidAmount: formatDecimal(instPaidPaisa),
      status,
      receiptNos:
        contributingReceipts.length > 0 ? contributingReceipts.join(", ") : null,
    });
  }

  const isCompleted = totalPaidPaisa >= netPricePaisa && netPricePaisa > 0n;

  return {
    paidTotalPkr: formatDecimal(totalPaidPaisa),
    isCompleted,
    installments: resultInstallments,
  };
}

export interface RescheduleDraftItem {
  seq: number;
  dueDate: string | Date;
  amountPkr: string;
}

export interface ValidateRescheduleResult {
  valid: boolean;
  expectedBalancePkr: string;
  actualSumPkr: string;
  differencePkr: string;
  error: string | null;
}

/**
 * Validates rescheduled installment proposals.
 * The sum of the new installments MUST equal the exact remaining balance.
 */
export function validateReschedule(
  unpaidBalancePkr: string,
  proposedInstallments: RescheduleDraftItem[],
  reason?: string,
): ValidateRescheduleResult {
  const expectedPaisa = parseDecimal(unpaidBalancePkr);

  if (proposedInstallments.length === 0) {
    return {
      valid: false,
      expectedBalancePkr: formatDecimal(expectedPaisa),
      actualSumPkr: "0.00",
      differencePkr: formatDecimal(expectedPaisa),
      error: "At least one installment is required.",
    };
  }

  if (reason !== undefined && reason.trim().length < 5) {
    return {
      valid: false,
      expectedBalancePkr: formatDecimal(expectedPaisa),
      actualSumPkr: "0.00",
      differencePkr: "0.00",
      error: "A reason of at least 5 characters is required.",
    };
  }

  let actualPaisa = 0n;
  let lastDate: number | null = null;

  for (let i = 0; i < proposedInstallments.length; i++) {
    const item = proposedInstallments[i]!;
    const itemAmountPaisa = parseDecimal(item.amountPkr || "0");

    if (itemAmountPaisa <= 0n) {
      return {
        valid: false,
        expectedBalancePkr: formatDecimal(expectedPaisa),
        actualSumPkr: formatDecimal(actualPaisa),
        differencePkr: formatDecimal(expectedPaisa - actualPaisa),
        error: `Installment #${item.seq} amount must be greater than zero.`,
      };
    }

    actualPaisa += itemAmountPaisa;

    const itemDate = new Date(item.dueDate).getTime();
    if (isNaN(itemDate)) {
      return {
        valid: false,
        expectedBalancePkr: formatDecimal(expectedPaisa),
        actualSumPkr: formatDecimal(actualPaisa),
        differencePkr: formatDecimal(expectedPaisa - actualPaisa),
        error: `Installment #${item.seq} has an invalid due date.`,
      };
    }

    if (lastDate !== null && itemDate < lastDate) {
      return {
        valid: false,
        expectedBalancePkr: formatDecimal(expectedPaisa),
        actualSumPkr: formatDecimal(actualPaisa),
        differencePkr: formatDecimal(expectedPaisa - actualPaisa),
        error: `Installment #${item.seq} due date must be on or after installment #${proposedInstallments[i - 1]!.seq}.`,
      };
    }
    lastDate = itemDate;
  }

  const diffPaisa = actualPaisa - expectedPaisa;
  if (diffPaisa !== 0n) {
    return {
      valid: false,
      expectedBalancePkr: formatDecimal(expectedPaisa),
      actualSumPkr: formatDecimal(actualPaisa),
      differencePkr: formatDecimal(diffPaisa < 0n ? -diffPaisa : diffPaisa),
      error: `Total rescheduled amount (${formatDecimal(actualPaisa)}) does not match required balance (${formatDecimal(expectedPaisa)}).`,
    };
  }

  return {
    valid: true,
    expectedBalancePkr: formatDecimal(expectedPaisa),
    actualSumPkr: formatDecimal(actualPaisa),
    differencePkr: "0.00",
    error: null,
  };
}

export interface LedgerRawEntry {
  date: Date;
  description: string;
  receiptNo?: string | null;
  debitPkr: string; // amount due / price
  creditPkr: string; // payment / refund / buyback
}

export interface ClientLedgerStatement {
  openingBalancePkr: string;
  closingBalancePkr: string;
  totalDebitsPkr: string;
  totalCreditsPkr: string;
  entries: Array<
    LedgerRawEntry & {
      runningBalancePkr: string;
    }
  >;
}

/**
 * Computes opening balance, running balances, and closing balance for a client statement.
 */
export function calculateClientLedger(
  allEntries: LedgerRawEntry[],
  periodStart?: Date,
  periodEnd?: Date,
): ClientLedgerStatement {
  // Sort chronological
  const sorted = [...allEntries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  let openingBalancePaisa = 0n;
  const inPeriodEntries: LedgerRawEntry[] = [];

  const startMs = periodStart ? new Date(periodStart).getTime() : -Infinity;
  const endMs = periodEnd ? new Date(periodEnd).getTime() : Infinity;

  for (const entry of sorted) {
    const entryMs = new Date(entry.date).getTime();
    const debitP = parseDecimal(entry.debitPkr || "0");
    const creditP = parseDecimal(entry.creditPkr || "0");

    if (entryMs < startMs) {
      openingBalancePaisa += debitP - creditP;
    } else if (entryMs <= endMs) {
      inPeriodEntries.push(entry);
    }
  }

  let runningPaisa = openingBalancePaisa;
  let totalDebitsPaisa = 0n;
  let totalCreditsPaisa = 0n;

  const entriesWithRunning = inPeriodEntries.map((entry) => {
    const debitP = parseDecimal(entry.debitPkr || "0");
    const creditP = parseDecimal(entry.creditPkr || "0");

    totalDebitsPaisa += debitP;
    totalCreditsPaisa += creditP;
    runningPaisa += debitP - creditP;

    return {
      ...entry,
      runningBalancePkr: formatDecimal(runningPaisa),
    };
  });

  return {
    openingBalancePkr: formatDecimal(openingBalancePaisa),
    closingBalancePkr: formatDecimal(runningPaisa),
    totalDebitsPkr: formatDecimal(totalDebitsPaisa),
    totalCreditsPkr: formatDecimal(totalCreditsPaisa),
    entries: entriesWithRunning,
  };
}
