"use client";

import * as React from "react";
import { Warning } from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MoneyInput } from "@/components/ui/money-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { editPayment } from "../actions";

export interface EditPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: {
    id: string;
    receiptNo: string;
    amount: string;
    method: string;
    chequeNo: string | null;
    bank: string | null;
    paidAt: Date | string;
    notes: string | null;
  } | null;
  onSuccess?: () => void;
}

interface EditPaymentDialogFormProps {
  payment: NonNullable<EditPaymentDialogProps["payment"]>;
  onClose: () => void;
  onSuccess?: () => void;
}

function EditPaymentDialogForm({
  payment,
  onClose,
  onSuccess,
}: EditPaymentDialogFormProps) {
  const initialMethod =
    payment.method === "CHEQUE" || payment.method === "BANK_TRANSFER"
      ? payment.method
      : "CASH";

  const [amountPkr, setAmountPkr] = React.useState(payment.amount);
  const [method, setMethod] = React.useState<"CASH" | "CHEQUE" | "BANK_TRANSFER">(
    initialMethod,
  );
  const [chequeNo, setChequeNo] = React.useState(payment.chequeNo || "");
  const [bank, setBank] = React.useState(payment.bank || "");
  const [paidAt, setPaidAt] = React.useState(
    new Date(payment.paidAt).toISOString().split("T")[0]!,
  );
  const [notes, setNotes] = React.useState(payment.notes || "");
  const [reason, setReason] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (reason.trim().length < 5) {
      setError("An audit reason of at least 5 characters is required.");
      return;
    }

    try {
      setSubmitting(true);
      await editPayment({
        paymentId: payment.id,
        amountPkr: amountPkr.trim(),
        method,
        chequeNo: chequeNo.trim() || undefined,
        bank: bank.trim() || undefined,
        paidAt: paidAt ? new Date(paidAt).toISOString() : undefined,
        notes: notes.trim() || undefined,
        reason: reason.trim(),
      });

      onClose();
      onSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update payment.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DialogContent className="max-w-md overflow-hidden p-0">
      <DialogHeader className="border-b border-line bg-subtle/30 p-4">
        <DialogTitle className="text-[16px] font-semibold text-ink">
          Edit Payment (Admin Only)
        </DialogTitle>
        <DialogDescription className="text-[12px] text-ink-muted">
          Receipt #{payment.receiptNo} · Modifications will automatically rebalance
          installment allocations.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
        {error && (
          <div className="flex items-center gap-2 rounded-[8px] border border-sold/20 bg-sold/10 p-3 text-[12px] text-sold">
            <Warning weight="fill" className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-medium text-ink-muted uppercase">
              Amount (PKR) *
            </label>
            <MoneyInput
              value={amountPkr}
              onChange={(e) => setAmountPkr(e.target.value)}
              placeholder="e.g. 50,000"
              className="mt-1"
              required
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-ink-muted uppercase">
              Payment Date *
            </label>
            <input
              type="date"
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
              className="mt-1 h-9 w-full rounded-[8px] border border-line bg-surface px-3 text-[13px] text-ink focus:outline-primary"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] font-medium text-ink-muted uppercase">
              Method *
            </label>
            <div className="mt-1">
              <Select
                value={method}
                onValueChange={(val: "CASH" | "CHEQUE" | "BANK_TRANSFER") =>
                  setMethod(val)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CHEQUE">Cheque</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-ink-muted uppercase">
              Cheque / Ref #
            </label>
            <input
              type="text"
              value={chequeNo}
              onChange={(e) => setChequeNo(e.target.value)}
              className="mt-1 h-9 w-full rounded-[8px] border border-line bg-surface px-3 text-[13px] text-ink focus:outline-primary"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-ink-muted uppercase">
              Bank
            </label>
            <input
              type="text"
              value={bank}
              onChange={(e) => setBank(e.target.value)}
              className="mt-1 h-9 w-full rounded-[8px] border border-line bg-surface px-3 text-[13px] text-ink focus:outline-primary"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-medium text-ink-muted uppercase">
            Notes
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes"
            className="mt-1 h-9 w-full rounded-[8px] border border-line bg-surface px-3 text-[13px] text-ink focus:outline-primary"
          />
        </div>

        <div>
          <label className="text-[11px] font-medium text-ink-muted uppercase">
            Reason for Edit (Required for Audit Log) *
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Correcting cheque clearance amount per bank slip"
            className="mt-1 h-9 w-full rounded-[8px] border border-line bg-surface px-3 text-[13px] text-ink focus:outline-primary"
            required
          />
        </div>

        <DialogFooter className="border-t border-line pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

export function EditPaymentDialog({
  open,
  onOpenChange,
  payment,
  onSuccess,
}: EditPaymentDialogProps) {
  if (!open || !payment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <EditPaymentDialogForm
        payment={payment}
        onClose={() => onOpenChange(false)}
        onSuccess={onSuccess}
      />
    </Dialog>
  );
}
