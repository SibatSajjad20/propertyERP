"use client";

import * as React from "react";
import { Printer, CheckCircle } from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatPkr } from "@/lib/money";

export interface PrintableReceiptData {
  receiptNo: string;
  paidAt: Date | string;
  amountPkr: string;
  method: string;
  chequeNo?: string | null;
  bank?: string | null;
  notes?: string | null;
  clientName: string;
  clientCnic: string;
  clientPhone: string;
  bookingNo: string;
  unitCode: string;
  floorName: string;
  receivedByName?: string | null;
}

export function PaymentReceiptDialog({
  open,
  onOpenChange,
  receipt,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: PrintableReceiptData | null;
}) {
  if (!receipt) return null;

  function handlePrint() {
    window.print();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg overflow-hidden p-0">
        <DialogHeader className="border-b border-line bg-subtle/30 p-4 print:hidden">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-[16px] font-semibold text-ink">
                Payment Receipt
              </DialogTitle>
              <DialogDescription className="text-[12px] text-ink-muted">
                Official acknowledgment of payment received
              </DialogDescription>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5"
            >
              <Printer weight="light" className="size-4" />
              <span>Print Receipt</span>
            </Button>
          </div>
        </DialogHeader>

        {/* Printable Receipt Paper */}
        <div className="bg-surface p-6 font-sans text-ink" id="printable-receipt">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-accent pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-[2px] bg-accent" />
                <h2 className="text-[18px] font-bold tracking-tight text-ink">
                  Sardar&apos;s Mall
                </h2>
              </div>
              <p className="mt-0.5 text-[11px] tracking-wider text-ink-muted uppercase">
                Official Payment Receipt
              </p>
            </div>
            <div className="text-right">
              <span className="font-mono text-[13px] font-bold text-primary">
                {receipt.receiptNo}
              </span>
              <p className="text-[11px] text-ink-muted tabular-nums">
                Date: {new Date(receipt.paidAt).toLocaleDateString("en-US")}
              </p>
            </div>
          </div>

          {/* Amount Callout */}
          <div className="my-5 rounded-[8px] border border-line bg-subtle/40 p-4 text-center">
            <span className="text-[11px] font-medium tracking-wider text-ink-muted uppercase">
              Amount Received
            </span>
            <div className="mt-1 font-sans text-[26px] font-bold text-available tabular-nums">
              {formatPkr(receipt.amountPkr)}
            </div>
            <span className="text-[11px] text-ink-muted">
              Method: {receipt.method.replaceAll("_", " ")}
              {receipt.bank && ` · ${receipt.bank}`}
              {receipt.chequeNo && ` (Cheque #${receipt.chequeNo})`}
            </span>
          </div>

          {/* Receipt Details Grid */}
          <div className="grid grid-cols-2 gap-3 border-y border-line py-4 text-[12px]">
            <div>
              <span className="text-ink-muted">Received From:</span>
              <p className="font-medium text-ink">{receipt.clientName}</p>
            </div>
            <div>
              <span className="text-ink-muted">Client CNIC:</span>
              <p className="font-mono text-[11px] text-ink">{receipt.clientCnic}</p>
            </div>
            <div>
              <span className="text-ink-muted">Booking Reference:</span>
              <p className="font-mono text-[11px] font-medium text-primary">
                {receipt.bookingNo}
              </p>
            </div>
            <div>
              <span className="text-ink-muted">Unit &amp; Floor:</span>
              <p className="font-medium text-ink">
                <span className="font-mono">{receipt.unitCode}</span> ({receipt.floorName}
                )
              </p>
            </div>
            {receipt.notes && (
              <div className="col-span-2">
                <span className="text-ink-muted">Notes:</span>
                <p className="text-[11px] text-ink italic">{receipt.notes}</p>
              </div>
            )}
          </div>

          {/* Footer signature line */}
          <div className="mt-8 flex items-end justify-between pt-4 text-[11px] text-ink-muted">
            <div>
              <p>Authorized Signature: _______________________</p>
              <p className="mt-1 font-medium text-ink">
                Received By: {receipt.receivedByName || "Accounts Department"}
              </p>
            </div>
            <div className="flex items-center gap-1.5 font-medium text-available">
              <CheckCircle weight="fill" className="size-4" />
              <span>Verified Payment</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
