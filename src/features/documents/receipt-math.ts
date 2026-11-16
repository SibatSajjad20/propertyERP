import { formatDecimal, parseDecimal } from "@/lib/money";

export const DEFAULT_DOWN_PAYMENT_PERCENT = "25.00";
export const DEFAULT_BOOKING_OFFICE = "SARDAR'S MALL";
export const EXCESS_NOTE =
  "The excess amount will be adjusted in the upcoming installment amount.";
export const RECEIPT_FOOTER_NOTE =
  'Please note: This "Receipt of Acknowledgment" will not be entertained without the stamp & signature of ASSH Developers (Pvt) Ltd.';

const HUNDRED_PERCENT_PAISA = 10_000n; // 100.00 stored via parseDecimal

function divRoundHalfUp(numerator: bigint, denominator: bigint): bigint {
  const negative = numerator < 0n !== denominator < 0n;
  const n = numerator < 0n ? -numerator : numerator;
  const d = denominator < 0n ? -denominator : denominator;
  const quotient = n / d;
  const remainder = n % d;
  const rounded = remainder * 2n >= d ? quotient + 1n : quotient;
  return negative ? -rounded : rounded;
}

export function percentOf(amount: string, percent: string): string {
  const amountPaisa = parseDecimal(amount);
  const percentPaisa = parseDecimal(percent);
  return formatDecimal(divRoundHalfUp(amountPaisa * percentPaisa, HUNDRED_PERCENT_PAISA));
}

export function ratioPercent(part: string, whole: string): string {
  const partPaisa = parseDecimal(part);
  const wholePaisa = parseDecimal(whole);
  if (wholePaisa === 0n) return DEFAULT_DOWN_PAYMENT_PERCENT;
  return formatDecimal(divRoundHalfUp(partPaisa * HUNDRED_PERCENT_PAISA, wholePaisa));
}

export function sumAmounts(amounts: string[]): string {
  let total = 0n;
  for (const amount of amounts) {
    total += parseDecimal(amount);
  }
  return formatDecimal(total);
}

export function subtractAmounts(left: string, right: string): string {
  return formatDecimal(parseDecimal(left) - parseDecimal(right));
}

export function isPositiveAmount(amount: string): boolean {
  return parseDecimal(amount) > 0n;
}

export type DownPaymentPlanKind = "FULL" | "PERCENT";

export function computeDownPaymentPlan(input: {
  netPrice: string;
  downPayment: string;
  installmentCount: number;
}): {
  kind: DownPaymentPlanKind;
  percent: string | null;
  percentLabel: string;
  required: string;
} {
  const net = parseDecimal(input.netPrice);
  const down = parseDecimal(input.downPayment);
  if (net > 0n && (down >= net || input.installmentCount <= 0)) {
    return {
      kind: "FULL",
      percent: null,
      percentLabel: "Full",
      required: formatDecimal(net),
    };
  }
  const percent =
    down > 0n && net > 0n
      ? ratioPercent(input.downPayment, input.netPrice)
      : DEFAULT_DOWN_PAYMENT_PERCENT;
  const required = down > 0n ? formatDecimal(down) : percentOf(input.netPrice, percent);
  return {
    kind: "PERCENT",
    percent,
    percentLabel: `${trimPercent(percent)}%`,
    required,
  };
}

function trimPercent(percent: string): string {
  return percent.replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
}

export type ReceiptPayment = {
  id?: string;
  amount: string;
  isVoided?: boolean;
  paidAt: Date | string;
  method?: string;
  bank?: string | null;
  reference?: string | null;
  chequeNo?: string | null;
  notes?: string | null;
};

export function selectDownPaymentPayments<T extends ReceiptPayment>(
  payments: T[],
  required: string,
): T[] {
  const requiredPaisa = parseDecimal(required);
  const active = [...payments]
    .filter((p) => !p.isVoided)
    .sort((a, b) => new Date(a.paidAt).getTime() - new Date(b.paidAt).getTime());
  if (requiredPaisa <= 0n) return active;

  const selected: T[] = [];
  let covered = 0n;
  for (const payment of active) {
    if (covered >= requiredPaisa) break;
    selected.push(payment);
    covered += parseDecimal(payment.amount);
  }
  return selected;
}

export function computeReceiptTotals(input: {
  netPrice: string;
  downPayment: string;
  installmentCount: number;
  payments: ReceiptPayment[];
}): {
  plan: ReturnType<typeof computeDownPaymentPlan>;
  listed: ReceiptPayment[];
  received: string;
  balance: string;
  excess: string;
  stillDue: string;
  showExcessNote: boolean;
} {
  const plan = computeDownPaymentPlan(input);
  const listed = selectDownPaymentPayments(input.payments, plan.required);
  const received = sumAmounts(listed.map((p) => p.amount));
  const balance = subtractAmounts(received, plan.required);
  const balancePaisa = parseDecimal(balance);
  const excess = balancePaisa > 0n ? balance : "0.00";
  const stillDue = balancePaisa < 0n ? formatDecimal(-balancePaisa) : "0.00";
  return {
    plan,
    listed,
    received,
    balance,
    excess,
    stillDue,
    showExcessNote: balancePaisa > 0n,
  };
}

export function installmentTypeLabel(plan: string | null | undefined): string {
  switch (plan) {
    case "MONTHLY":
      return "Monthly";
    case "QUARTERLY":
      return "Quarterly";
    case "SEMI_ANNUAL":
      return "Semi-annual";
    default:
      return plan?.trim() || "—";
  }
}

export function typicalInstallmentAmount(
  installments: Array<{ amount: string; status?: string }>,
): string {
  const active = installments.filter((row) => row.status !== "CANCELLED");
  return active[0]?.amount ?? "0.00";
}

export const PAYMENT_MODE_LABELS: Record<string, string> = {
  CASH: "Cash",
  CHEQUE: "Cheque",
  BANK_TRANSFER: "Online",
  PAY_ORDER: "Pay Order",
};

export function paymentModeLabel(method: string | null | undefined): string {
  if (!method) return "—";
  return PAYMENT_MODE_LABELS[method] ?? method;
}

export function paymentReference(payment: ReceiptPayment): string {
  return (
    payment.reference?.trim() || payment.chequeNo?.trim() || payment.notes?.trim() || "—"
  );
}
