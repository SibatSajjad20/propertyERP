"use client";

import * as React from "react";
import { Warning, Prohibit } from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatPkr } from "@/lib/money";
import { voidPayment } from "../actions";

export interface VoidPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: {
    id: string;
    receiptNo: string;
    amount: string;
  } | null;
  onSuccess?: () => void;
}

interface VoidPaymentDialogFormProps {
  payment: NonNullable<VoidPaymentDialogProps["payment"]>;
  onClose: () => void;
  onSuccess?: () => void;
}

function VoidPaymentDialogForm({
  payment,
  onClose,
  onSuccess,
}: VoidPaymentDialogFormProps) {
  const [reason, setReason] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (reason.trim().length < 5) {
      setError("An audit reason of at least 5 characters is required to void a payment.");
      return;
    }

    try {
      setSubmitting(true);
      await voidPayment({
        paymentId: payment.id,
        reason: reason.trim(),
      });

      onClose();
      onSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to void payment.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DialogContent className="max-w-md overflow-hidden p-0">
      <DialogHeader className="border-b border-line bg-sold/10 p-4">
        <div className="flex items-center gap-2 text-sold">
          <Prohibit weight="bold" className="size-5" />
          <DialogTitle className="text-[16px] font-semibold text-ink">
            Void Payment Receipt
          </DialogTitle>
        </div>
        <DialogDescription className="text-[12px] text-ink-muted">
          Receipt #{payment.receiptNo} · Amount: {formatPkr(payment.amount)}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
        {error && (
          <div className="flex items-center gap-2 rounded-[8px] border border-sold/20 bg-sold/10 p-3 text-[12px] text-sold">
            <Warning weight="fill" className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="rounded-[8px] border border-sold/30 bg-sold/5 p-3 text-[12px] text-ink">
          <p className="font-semibold text-sold">Audit Log Policy</p>
          <p className="mt-1 leading-relaxed text-ink-muted">
            Payments are never hard-deleted. Voiding will record an official audit log,
            revoke this receipt, and automatically recalculate installment waterfall
            allocations.
          </p>
        </div>

        <div>
          <label className="text-[11px] font-medium text-ink-muted uppercase">
            Reason for Voiding (Required) *
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Cheque returned by bank / Entry created in error"
            className="mt-1 h-9 w-full rounded-[8px] border border-line bg-surface px-3 text-[13px] text-ink focus:outline-primary"
            required
            autoFocus
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
          <Button type="submit" variant="danger" disabled={submitting}>
            {submitting ? "Voiding..." : "Confirm & Void Payment"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

export function VoidPaymentDialog({
  open,
  onOpenChange,
  payment,
  onSuccess,
}: VoidPaymentDialogProps) {
  if (!open || !payment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <VoidPaymentDialogForm
        payment={payment}
        onClose={() => onOpenChange(false)}
        onSuccess={onSuccess}
      />
    </Dialog>
  );
}
