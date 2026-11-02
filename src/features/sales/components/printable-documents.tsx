/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import * as React from "react";
import { Printer, X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { formatPkr } from "@/lib/money";

interface PrintableReceiptProps {
  receiptNo: string;
  paidAt: Date | string;
  clientName: string;
  clientCnic: string;
  clientPhone: string;
  unitCode: string;
  amountPkr: string;
  method: string;
  chequeNo?: string | null;
  bank?: string | null;
  receivedByName?: string | null;
  notes?: string | null;
  bookingNo?: string | null;
}

export function PrintableReceiptDialog({
  open,
  onOpenChange,
  receipt,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: PrintableReceiptProps | null;
}) {
  if (!receipt) return null;

  const dateStr =
    receipt.paidAt instanceof Date
      ? receipt.paidAt.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : new Date(receipt.paidAt).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl overflow-hidden bg-white p-0 text-ink print:m-0 print:border-none print:p-0 print:shadow-none">
        {/* Print controls header */}
        <div className="flex items-center justify-between border-b border-line bg-subtle px-6 py-3 print:hidden">
          <span className="text-[13px] font-medium text-ink">
            Official Payment Receipt
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="primary"
              onClick={() => window.print()}
              className="gap-1.5"
            >
              <Printer weight="light" className="size-4" />
              Print Receipt
            </Button>
            <Button size="sm" variant="secondary" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>

        {/* Printable Paper Canvas */}
        <div className="space-y-6 p-8 text-[12px] print:p-4">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-primary pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-[2px] bg-accent" />
                <h1 className="font-serif text-[20px] font-bold tracking-tight text-ink">
                  Sardar&apos;s Mall
                </h1>
              </div>
              <p className="text-[11px] text-ink-muted">
                Commercial Enterprise & Property Management
              </p>
              <p className="text-[11px] text-ink-muted">
                Main Commercial Boulevard, Islamabad
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block rounded border border-line bg-subtle px-2 py-0.5 font-mono text-[13px] font-bold text-primary">
                {receipt.receiptNo}
              </span>
              <p className="mt-1 font-sans text-[11px] text-ink-muted tabular-nums">
                Date: {dateStr}
              </p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 border-b border-line pb-4">
            <div>
              <span className="text-[11px] text-ink-muted uppercase">Received From:</span>
              <p className="text-[13px] font-semibold text-ink">{receipt.clientName}</p>
              <p className="font-mono text-[12px] text-ink-muted">
                CNIC: {receipt.clientCnic}
              </p>
              <p className="font-sans text-[12px] text-ink-muted tabular-nums">
                Tel: {receipt.clientPhone}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-ink-muted uppercase">Property Unit:</span>
              <p className="font-mono text-[14px] font-bold text-primary">
                {receipt.unitCode}
              </p>
              {receipt.bookingNo && (
                <p className="font-mono text-[12px] text-ink-muted">
                  Booking: {receipt.bookingNo}
                </p>
              )}
            </div>
          </div>

          {/* Amount Box */}
          <div className="flex items-center justify-between rounded-[8px] border-2 border-line-strong bg-subtle/50 p-4">
            <div>
              <span className="text-[11px] font-semibold text-ink-muted uppercase">
                Payment Amount Received
              </span>
              <p className="font-sans text-[20px] font-bold text-ink tabular-nums">
                {formatPkr(receipt.amountPkr)}
              </p>
            </div>
            <div className="text-right text-[12px]">
              <span className="font-medium text-ink">Method: {receipt.method}</span>
              {receipt.chequeNo && (
                <p className="text-ink-muted">
                  Instrument No: {receipt.chequeNo} ({receipt.bank})
                </p>
              )}
            </div>
          </div>

          {receipt.notes && (
            <div>
              <span className="text-[11px] text-ink-muted">Notes:</span>
              <p className="text-ink italic">{receipt.notes}</p>
            </div>
          )}

          {/* Signature Lines */}
          <div className="grid grid-cols-2 gap-8 border-t border-line pt-12 text-center text-[11px]">
            <div>
              <div className="mx-auto w-3/4 border-t border-ink/40 pt-1">
                <span className="font-medium text-ink">
                  {receipt.receivedByName || "Authorized Cashier"}
                </span>
                <p className="text-ink-muted">Received By / Accounts Officer</p>
              </div>
            </div>
            <div>
              <div className="mx-auto w-3/4 border-t border-ink/40 pt-1">
                <span className="font-medium text-ink">{receipt.clientName}</span>
                <p className="text-ink-muted">Customer Signature / Acknowledgement</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function PrintableBookingFormDialog({
  open,
  onOpenChange,
  bookingDetail,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingDetail: any;
}) {
  if (!bookingDetail) return null;
  const { booking, nextOfKin, installments } = bookingDetail;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl overflow-hidden bg-white p-0 text-ink print:m-0 print:border-none print:p-0 print:shadow-none">
        <div className="flex items-center justify-between border-b border-line bg-subtle px-6 py-3 print:hidden">
          <span className="text-[13px] font-medium text-ink">
            Official Booking Application
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="primary"
              onClick={() => window.print()}
              className="gap-1.5"
            >
              <Printer weight="light" className="size-4" />
              Print Application Form
            </Button>
            <Button size="sm" variant="secondary" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>

        <div className="max-h-[85vh] space-y-6 overflow-y-auto p-8 text-[12px] print:max-h-none print:overflow-visible print:p-4">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-primary pb-4">
            <div>
              <h1 className="font-serif text-[22px] font-bold text-ink">
                Sardar&apos;s Mall
              </h1>
              <p className="text-[11px] text-ink-muted">
                Commercial Space Booking Agreement
              </p>
            </div>
            <div className="text-right">
              <span className="font-mono text-[14px] font-bold text-primary">
                {booking.bookingNo}
              </span>
              <p className="text-[11px] text-ink-muted">
                Dated: {new Date(booking.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Unit & Client Details */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5 rounded border border-line p-3">
              <span className="text-[11px] font-bold text-ink uppercase">
                Applicant Information
              </span>
              <p>
                <span className="text-ink-muted">Name:</span> {booking.clientName}
              </p>
              <p>
                <span className="text-ink-muted">CNIC:</span> {booking.clientCnic}
              </p>
              <p>
                <span className="text-ink-muted">Phone:</span> {booking.clientPhone}
              </p>
              <p>
                <span className="text-ink-muted">Address:</span> {booking.homeAddress}
              </p>
              {nextOfKin && (
                <p>
                  <span className="text-ink-muted">Nominee:</span> {nextOfKin.name} (
                  {nextOfKin.relation})
                </p>
              )}
            </div>

            <div className="space-y-1.5 rounded border border-line p-3">
              <span className="text-[11px] font-bold text-ink uppercase">
                Unit Specification
              </span>
              <p>
                <span className="text-ink-muted">Unit Code:</span>{" "}
                <span className="font-mono font-bold">{booking.unitCode}</span>
              </p>
              <p>
                <span className="text-ink-muted">Floor & Category:</span>{" "}
                {booking.floorName} · {booking.categoryName}
              </p>
              <p>
                <span className="text-ink-muted">Net Area:</span> {booking.netAreaSqft} sq
                ft
              </p>
              <p>
                <span className="text-ink-muted">Net Price:</span>{" "}
                <span className="font-bold">{formatPkr(booking.netPrice)}</span>
              </p>
              <p>
                <span className="text-ink-muted">Down Payment:</span>{" "}
                {formatPkr(booking.downPayment)}
              </p>
            </div>
          </div>

          {/* Installment Schedule */}
          <div>
            <h3 className="mb-2 text-[13px] font-bold text-ink">
              Approved Installment Schedule
            </h3>
            <table className="w-full border-collapse border border-line text-[11px]">
              <thead className="bg-subtle font-semibold text-ink">
                <tr>
                  <th className="border border-line px-2 py-1 text-left">#</th>
                  <th className="border border-line px-2 py-1 text-left">Due Date</th>
                  <th className="border border-line px-2 py-1 text-right">
                    Amount (PKR)
                  </th>
                  <th className="border border-line px-2 py-1 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {installments.map((inst: any) => (
                  <tr key={inst.seq}>
                    <td className="border border-line px-2 py-1">Inst. {inst.seq}</td>
                    <td className="border border-line px-2 py-1">
                      {new Date(inst.dueDate).toLocaleDateString()}
                    </td>
                    <td className="border border-line px-2 py-1 text-right font-mono">
                      {formatPkr(inst.amount)}
                    </td>
                    <td className="border border-line px-2 py-1">{inst.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Terms & Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-8 text-center text-[11px]">
            <div>
              <div className="mx-auto w-3/4 border-t border-ink pt-1">
                <p className="font-semibold">{booking.clientName}</p>
                <p className="text-ink-muted">Applicant Signature</p>
              </div>
            </div>
            <div>
              <div className="mx-auto w-3/4 border-t border-ink pt-1">
                <p className="font-semibold">Authorized Signatory</p>
                <p className="text-ink-muted">Sardar&apos;s Mall Management</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
