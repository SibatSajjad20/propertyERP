"use client";

import * as React from "react";
import { Plus, Trash, Warning, CheckCircle } from "@phosphor-icons/react";
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
import { formatPkr, parseDecimal } from "@/lib/money";
import { validateReschedule } from "../calculator";
import { rescheduleInstallments } from "../actions";
import type { BookingScheduleDetail } from "../queries";

export interface RescheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: BookingScheduleDetail;
  onSuccess?: () => void;
}

interface DraftRow {
  seq: number;
  dueDate: string;
  amountPkr: string;
}

interface RescheduleDialogFormProps {
  booking: BookingScheduleDetail;
  onClose: () => void;
  onSuccess?: () => void;
}

function RescheduleDialogForm({
  booking,
  onClose,
  onSuccess,
}: RescheduleDialogFormProps) {
  // Identify unpaid installments
  const unpaidInstallments = React.useMemo(() => {
    return booking.schedule.filter(
      (inst) => inst.status !== "PAID" && inst.status !== "CANCELLED",
    );
  }, [booking.schedule]);

  // Calculate unpaid balance
  const unpaidBalancePkr = React.useMemo(() => {
    let balancePaisa = 0n;
    for (const inst of unpaidInstallments) {
      const amtP = parseDecimal(inst.amount);
      const paidP = parseDecimal(inst.paidAmount);
      balancePaisa += amtP - paidP;
    }
    return (Number(balancePaisa) / 100).toFixed(2);
  }, [unpaidInstallments]);

  // Initial draft rows from current unpaid installments
  const [draftRows, setDraftRows] = React.useState<DraftRow[]>(() => {
    if (unpaidInstallments.length > 0) {
      return unpaidInstallments.map((inst, idx) => ({
        seq: idx + 1,
        dueDate: new Date(inst.dueDate).toISOString().split("T")[0]!,
        amountPkr: (
          Number(parseDecimal(inst.amount) - parseDecimal(inst.paidAmount)) / 100
        ).toFixed(2),
      }));
    }
    return [];
  });

  const [reason, setReason] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Live validation
  const validation = React.useMemo(() => {
    return validateReschedule(unpaidBalancePkr, draftRows, reason);
  }, [unpaidBalancePkr, draftRows, reason]);

  function handleRowChange(index: number, field: "dueDate" | "amountPkr", val: string) {
    setDraftRows((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index]!, [field]: val };
      return copy;
    });
  }

  function handleAddRow() {
    setDraftRows((prev) => {
      const last = prev[prev.length - 1];
      let nextDate = new Date();
      if (last?.dueDate) {
        const d = new Date(last.dueDate);
        d.setMonth(d.getMonth() + 1);
        nextDate = d;
      }
      return [
        ...prev,
        {
          seq: prev.length + 1,
          dueDate: nextDate.toISOString().split("T")[0]!,
          amountPkr: "0.00",
        },
      ];
    });
  }

  function handleRemoveRow(index: number) {
    setDraftRows((prev) => {
      const filtered = prev.filter((_, idx) => idx !== index);
      return filtered.map((row, idx) => ({ ...row, seq: idx + 1 }));
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!validation.valid) {
      setError(validation.error || "Please resolve validation errors first.");
      return;
    }

    try {
      setSubmitting(true);
      await rescheduleInstallments({
        bookingId: booking.id,
        installments: draftRows,
        reason: reason.trim(),
      });

      onClose();
      onSuccess?.();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to reschedule installments.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DialogContent className="max-w-2xl overflow-hidden p-0">
      <DialogHeader className="border-b border-line bg-subtle/30 p-4">
        <div className="flex items-center justify-between">
          <div>
            <DialogTitle className="text-[16px] font-semibold text-ink">
              Reschedule Installments (Admin Only)
            </DialogTitle>
            <DialogDescription className="text-[12px] text-ink-muted">
              Booking #{booking.bookingNo} · Modify due dates and payment distribution
            </DialogDescription>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-medium tracking-wider text-ink-muted uppercase">
              Target Balance
            </span>
            <p className="font-sans text-[16px] font-bold text-ink tabular-nums">
              {formatPkr(unpaidBalancePkr)}
            </p>
          </div>
        </div>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
        {error && (
          <div className="flex items-center gap-2 rounded-[8px] border border-sold/20 bg-sold/10 p-3 text-[12px] text-sold">
            <Warning weight="fill" className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Validation Status Indicator */}
        <div
          className={`flex items-center justify-between rounded-[8px] border p-3 text-[12px] ${
            validation.valid
              ? "border-available/30 bg-available/10 text-available"
              : "border-sold/30 bg-sold/10 text-sold"
          }`}
        >
          <div className="flex items-center gap-2">
            {validation.valid ? (
              <CheckCircle weight="fill" className="size-4 shrink-0" />
            ) : (
              <Warning weight="fill" className="size-4 shrink-0" />
            )}
            <span className="font-medium">
              {validation.valid
                ? "Exact Match ✓ Total equals remaining balance."
                : validation.error}
            </span>
          </div>
          <div className="text-right font-sans tabular-nums">
            <span>Sum: {formatPkr(validation.actualSumPkr)}</span>
            {validation.differencePkr !== "0.00" && (
              <span className="ml-2 opacity-80">
                (Diff: {formatPkr(validation.differencePkr)})
              </span>
            )}
          </div>
        </div>

        {/* Installments Table Editor */}
        <div className="max-h-60 overflow-hidden overflow-y-auto rounded-[8px] border border-line">
          <table className="w-full text-left font-sans text-[12px]">
            <thead className="sticky top-0 border-b border-line bg-subtle/60 bg-surface text-[11px] font-medium tracking-wider text-ink-muted uppercase">
              <tr>
                <th className="w-12 px-3 py-2 text-center">#</th>
                <th className="px-3 py-2">Due Date</th>
                <th className="px-3 py-2">Amount (PKR)</th>
                <th className="w-12 px-3 py-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {draftRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-subtle/20">
                  <td className="px-3 py-2 text-center font-mono text-[11px] text-ink-muted">
                    {row.seq}
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="date"
                      value={row.dueDate}
                      onChange={(e) => handleRowChange(idx, "dueDate", e.target.value)}
                      className="h-8 w-full rounded-[6px] border border-line bg-surface px-2 text-[12px] text-ink focus:outline-primary"
                      required
                    />
                  </td>
                  <td className="px-3 py-2">
                    <MoneyInput
                      sizeVariant="sm"
                      value={row.amountPkr}
                      onChange={(e) => handleRowChange(idx, "amountPkr", e.target.value)}
                      className="h-8 w-full rounded-[6px] px-2 text-[12px]"
                      required
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(idx)}
                      disabled={draftRows.length <= 1}
                      className="cursor-pointer p-1 text-ink-muted hover:text-sold disabled:opacity-30"
                      title="Remove installment"
                    >
                      <Trash weight="light" className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between">
          <Button type="button" variant="secondary" size="sm" onClick={handleAddRow}>
            <Plus weight="bold" className="size-3.5" />
            <span>Add Installment</span>
          </Button>
        </div>

        <div>
          <label className="text-[11px] font-medium text-ink-muted uppercase">
            Reason for Rescheduling (Required for Audit Log) *
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Revised payment plan requested by client per agreement"
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
          <Button
            type="submit"
            variant="primary"
            disabled={submitting || !validation.valid}
          >
            {submitting ? "Applying..." : "Confirm Reschedule"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

export function RescheduleDialog({
  open,
  onOpenChange,
  booking,
  onSuccess,
}: RescheduleDialogProps) {
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <RescheduleDialogForm
        booking={booking}
        onClose={() => onOpenChange(false)}
        onSuccess={onSuccess}
      />
    </Dialog>
  );
}
