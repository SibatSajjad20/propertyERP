"use client";

import * as React from "react";
import { CheckCircle, Warning } from "@phosphor-icons/react";
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
import { allocatePayment } from "@/features/sales/calculator";
import { recordInstallmentPayment } from "../actions";
import type { BookingScheduleDetail } from "../queries";
import type { PrintableReceiptData } from "./payment-receipt-dialog";

export interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: BookingScheduleDetail;
  client: { fullName: string; cnic: string; phone: string };
  onPaymentSuccess?: (receipt: PrintableReceiptData) => void;
}

export function RecordPaymentDialog({
  open,
  onOpenChange,
  booking,
  client,
  onPaymentSuccess,
}: RecordPaymentDialogProps) {
  const [amountPkr, setAmountPkr] = React.useState("");
  const [method, setMethod] = React.useState<"CASH" | "CHEQUE" | "BANK_TRANSFER">("CASH");
  const [chequeNo, setChequeNo] = React.useState("");
  const [bank, setBank] = React.useState("");
  const [paidAt, setPaidAt] = React.useState(new Date().toISOString().split("T")[0]!);
  const [notes, setNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Compute live waterfall allocation preview
  const allocationPreview = React.useMemo(() => {
    const trimmed = amountPkr.trim();
    if (!trimmed || isNaN(Number(trimmed)) || Number(trimmed) <= 0) {
      return null;
    }

    try {
      // Map booking's installments
      const instRows = booking.schedule.map((i) => ({
        id: i.id,
        seq: i.seq,
        dueDate: new Date(i.dueDate),
        amount: i.amount,
        paidAmount: i.paidAmount,
        status: i.status,
      }));

      return allocatePayment({
        paymentAmountPkr: trimmed,
        currentPaidTotalPkr: booking.paidTotal,
        netPricePkr: booking.netPrice,
        installments: instRows,
      });
    } catch {
      return null;
    }
  }, [amountPkr, booking]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = amountPkr.trim();
    if (!trimmed || isNaN(Number(trimmed)) || Number(trimmed) <= 0) {
      setError("Please enter a valid positive payment amount.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await recordInstallmentPayment({
        bookingId: booking.id,
        amountPkr: trimmed,
        method,
        chequeNo: chequeNo.trim() || undefined,
        bank: bank.trim() || undefined,
        paidAt: paidAt ? new Date(paidAt).toISOString() : undefined,
        notes: notes.trim() || undefined,
      });

      onOpenChange(false);

      if (onPaymentSuccess) {
        onPaymentSuccess({
          receiptNo: res.receiptNo,
          paidAt: paidAt || new Date(),
          amountPkr: trimmed,
          method,
          chequeNo: chequeNo.trim() || null,
          bank: bank.trim() || null,
          notes: notes.trim() || null,
          clientName: client.fullName,
          clientCnic: client.cnic,
          clientPhone: client.phone,
          bookingNo: booking.bookingNo,
          unitCode: booking.unit.unitCode,
          floorName: booking.unit.floorName,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to record payment.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg overflow-hidden p-0">
        <DialogHeader className="border-b border-line bg-subtle/30 p-4">
          <DialogTitle className="text-[16px] font-semibold text-ink">
            Record Installment Payment
          </DialogTitle>
          <DialogDescription className="text-[12px] text-ink-muted">
            Booking #{booking.bookingNo} · Unit {booking.unit.unitCode} ({client.fullName}
            )
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
          {error && (
            <div className="flex items-center gap-2 rounded-[8px] border border-sold/20 bg-sold/10 p-3 text-[12px] text-sold">
              <Warning weight="fill" className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Amount & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-ink-muted uppercase">
                Payment Amount (PKR) *
              </label>
              <MoneyInput
                value={amountPkr}
                onChange={(e) => setAmountPkr(e.target.value)}
                placeholder="e.g. 1,50,000"
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
                className="mt-1 h-9 w-full rounded-[6px] border border-line bg-surface px-3 text-[13px] text-ink focus:outline-primary"
                required
              />
            </div>
          </div>

          {/* Method & Bank/Cheque */}
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
                placeholder="Optional"
                className="mt-1 h-9 w-full rounded-[6px] border border-line bg-surface px-3 text-[12px] text-ink focus:outline-primary"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-ink-muted uppercase">
                Bank Name
              </label>
              <input
                type="text"
                value={bank}
                onChange={(e) => setBank(e.target.value)}
                placeholder="e.g. HBL"
                className="mt-1 h-9 w-full rounded-[6px] border border-line bg-surface px-3 text-[12px] text-ink focus:outline-primary"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[11px] font-medium text-ink-muted uppercase">
              Notes / Remarks
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional payment notes..."
              className="mt-1 h-9 w-full rounded-[6px] border border-line bg-surface px-3 text-[12px] text-ink focus:outline-primary"
            />
          </div>

          {/* Live Waterfall Allocation Preview */}
          {allocationPreview && (
            <div className="flex flex-col gap-2 rounded-[8px] border border-line bg-subtle/50 p-3.5">
              <div className="flex items-center justify-between text-[11px] font-medium text-ink">
                <span>Waterfall Allocation Preview</span>
                <span className="font-semibold text-available tabular-nums">
                  {allocationPreview.allocations.length} installment
                  {allocationPreview.allocations.length === 1 ? "" : "s"} updated
                </span>
              </div>

              <div className="flex max-h-36 flex-col gap-1.5 overflow-y-auto pr-1">
                {allocationPreview.allocations.map((alloc) => (
                  <div
                    key={alloc.installmentId}
                    className="flex items-center justify-between rounded-[4px] border border-line/60 bg-surface p-1.5 text-[11px]"
                  >
                    <span className="font-mono text-ink">Inst #{alloc.seq}</span>
                    <span className="text-ink-muted tabular-nums">
                      +Rs {alloc.allocatedPkr}
                    </span>
                    <span
                      className={
                        alloc.newStatus === "PAID"
                          ? "font-medium text-available"
                          : "font-medium text-accent"
                      }
                    >
                      {alloc.newStatus}
                    </span>
                  </div>
                ))}
              </div>

              {/* Completion Banner */}
              {allocationPreview.isCompleted && (
                <div className="mt-1 flex items-center gap-2 rounded-[6px] border border-available/30 bg-available/10 p-2 text-[11px] font-medium text-available">
                  <CheckCircle weight="fill" className="size-4 shrink-0" />
                  <span>
                    100% Paid! This payment will complete the booking and automatically
                    move Unit {booking.unit.unitCode} to SOLD.
                  </span>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="border-t border-line pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? "Recording..." : "Record & Print Receipt"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
