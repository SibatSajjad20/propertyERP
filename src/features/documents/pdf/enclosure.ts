import { formatPkr } from "@/lib/money";
import type { PdfEnclosure } from "./form-document";

export function paymentModeLabel(method?: string | null) {
  if (method === "CASH") return "Cash";
  if (method === "CHEQUE") return "Cheque";
  if (method === "BANK_TRANSFER") return "Pay Order";
  return method ?? "";
}

export function enclosureFromDownPayment(
  payment?: {
    amount: string;
    method: string;
    chequeNo?: string | null;
    bank?: string | null;
    paidAt: Date | string;
    isVoided?: boolean;
  } | null,
): PdfEnclosure | undefined {
  if (!payment || payment.isVoided) return undefined;
  const paidAt =
    payment.paidAt instanceof Date ? payment.paidAt : new Date(payment.paidAt);
  return {
    amount: formatPkr(payment.amount),
    mode: paymentModeLabel(payment.method),
    reference: payment.chequeNo ?? "",
    date: paidAt.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    bank: payment.bank ?? "",
  };
}
