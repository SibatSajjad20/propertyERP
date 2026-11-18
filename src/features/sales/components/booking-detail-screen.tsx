/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUUpLeft,
  CheckCircle,
  CurrencyDollar,
  FileText,
  Plus,
  Printer,
  Receipt,
  ShieldCheck,
  Warning,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { effectivePricingArea, formatUnitDisplayCode } from "@/lib/area";
import { formatPkr, parseDecimal } from "@/lib/money";
import { cn } from "@/lib/cn";
import { toast } from "sonner";
import type { UserRole, PaymentMethod } from "@/db/schema/enums";
import { recordPayment, returnBooking } from "../actions";
import { allocatePayment, calculateRefund } from "../calculator";
import {
  calculateInstallmentSurcharge,
  summarizeBookingSurcharges,
} from "@/features/installments/surcharge";
import {
  toggleBookingSurchargeExemption,
  waiveInstallmentSurcharge,
} from "@/features/installments/actions";
import { DocumentsSection } from "@/features/documents/components/documents-section";
import { PdfDownloadBar } from "@/features/documents/components/pdf-download-bar";
import { DownPaymentReceiptButton } from "@/features/documents/components/down-payment-receipt-button";
import {
  PrintableReceiptDialog,
  PrintableBookingFormDialog,
} from "./printable-documents";

interface BookingDetailScreenProps {
  data: any;
  role: UserRole;
  signatories?: Array<{ id: string; name: string; designation: string }>;
}

export function BookingDetailScreen({
  data,
  role,
  signatories = [],
}: BookingDetailScreenProps) {
  const router = useRouter();
  const { booking, nextOfKin, installments, payments, refunds, documents } = data;

  // Dialog states
  const [recordPaymentOpen, setRecordPaymentOpen] = React.useState(false);
  const [returnBookingOpen, setReturnBookingOpen] = React.useState(false);
  const [bookingFormOpen, setBookingFormOpen] = React.useState(false);
  const [activeReceipt, setActiveReceipt] = React.useState<any>(null);

  // Surcharge Waive / Remove Policy state (ADMIN)
  const [waiveTarget, setWaiveTarget] = React.useState<any>(null);
  const [waiveReason, setWaiveReason] = React.useState("");
  const [waiving, setWaiving] = React.useState(false);
  const [exemptDialogOpen, setExemptDialogOpen] = React.useState(false);
  const [exemptReason, setExemptReason] = React.useState("");
  const [togglingExempt, setTogglingExempt] = React.useState(false);

  const surchargeSummary = React.useMemo(
    () =>
      summarizeBookingSurcharges(
        installments.map((i: any) => ({
          amount: i.amount,
          paidAmount: i.paidAmount,
          dueDate: i.dueDate,
          status: i.status,
          surchargeWaived: i.surchargeWaived,
          surchargeWaivedAmount: i.surchargeWaivedAmount,
          surchargePaidAmount: i.surchargePaidAmount,
        })),
        Boolean(booking.surchargeExempt),
      ),
    [installments, booking.surchargeExempt],
  );

  async function handleConfirmWaiveSurcharge() {
    if (!waiveTarget) return;
    if (waiveReason.trim().length < 5) {
      toast.error("Please enter a waiver reason (at least 5 characters)");
      return;
    }
    setWaiving(true);
    try {
      await waiveInstallmentSurcharge({
        installmentId: waiveTarget.id,
        waiveFull: true,
        reason: waiveReason.trim(),
      });
      toast.success(`Surcharge waived for Installment #${waiveTarget.seq}`);
      setWaiveTarget(null);
      setWaiveReason("");
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || "Failed to waive surcharge");
    } finally {
      setWaiving(false);
    }
  }

  async function handleToggleSurchargePolicy() {
    if (exemptReason.trim().length < 5) {
      toast.error("Please enter a policy reason (at least 5 characters)");
      return;
    }
    setTogglingExempt(true);
    try {
      const nextExempt = !booking.surchargeExempt;
      await toggleBookingSurchargeExemption({
        bookingId: booking.id,
        exempt: nextExempt,
        reason: exemptReason.trim(),
      });
      toast.success(
        nextExempt
          ? "Surcharge Remove Policy enabled for this booking."
          : "Standard 0.1%/day surcharge policy restored.",
      );
      setExemptDialogOpen(false);
      setExemptReason("");
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update surcharge policy");
    } finally {
      setTogglingExempt(false);
    }
  }

  // Record payment form state
  const [paymentAmount, setPaymentAmount] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>("CASH");
  const [chequeNo, setChequeNo] = React.useState("");
  const [bank, setBank] = React.useState("");
  const [paidAt, setPaidAt] = React.useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = React.useState("");
  const [isSubmittingPayment, setIsSubmittingPayment] = React.useState(false);

  // Return booking form state
  const [deductionType, setDeductionType] = React.useState<"AMOUNT" | "PERCENT">(
    "PERCENT",
  );
  const [deductionValue, setDeductionValue] = React.useState("10"); // default 10% cancellation fee
  const [refundMethod, setRefundMethod] = React.useState<PaymentMethod>("CHEQUE");
  const [refundChequeNo, setRefundChequeNo] = React.useState("");
  const [refundBank, setRefundBank] = React.useState("");
  const [returnReason, setReturnReason] = React.useState("");
  const [isSubmittingReturn, setIsSubmittingReturn] = React.useState(false);

  // Live payment allocation preview
  const allocationPreview = React.useMemo(() => {
    if (!paymentAmount || Number(paymentAmount) <= 0) return null;
    return allocatePayment({
      paymentAmountPkr: paymentAmount,
      currentPaidTotalPkr: booking.paidTotal,
      netPricePkr: booking.netPrice,
      installments,
    });
  }, [paymentAmount, booking, installments]);

  // Live refund preview
  const refundPreview = React.useMemo(() => {
    return calculateRefund({
      paidTotalPkr: booking.paidTotal,
      deductionType,
      deductionValue,
    });
  }, [booking.paidTotal, deductionType, deductionValue]);

  async function handleRecordPayment() {
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }
    setIsSubmittingPayment(true);
    try {
      const res = await recordPayment({
        bookingId: booking.id,
        amountPkr: paymentAmount,
        method: paymentMethod,
        chequeNo: chequeNo || undefined,
        bank: bank || undefined,
        paidAt,
        notes: notes || undefined,
      });

      toast.success(`Payment recorded (${res?.receiptNo || ""})!`);
      setRecordPaymentOpen(false);
      setPaymentAmount("");
      setChequeNo("");
      setBank("");
      setNotes("");
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || "Failed to record payment");
    } finally {
      setIsSubmittingPayment(false);
    }
  }

  async function handleReturnBooking() {
    if (!returnReason || returnReason.trim().length < 10) {
      toast.error("Please enter a cancellation reason of at least 10 characters");
      return;
    }
    setIsSubmittingReturn(true);
    try {
      await returnBooking({
        bookingId: booking.id,
        deductionType,
        deductionValue,
        method: refundMethod,
        chequeNo: refundChequeNo || undefined,
        bank: refundBank || undefined,
        reason: returnReason,
      });

      toast.success("Booking returned and unit released back to Available.");
      setReturnBookingOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || "Failed to return booking");
    } finally {
      setIsSubmittingReturn(false);
    }
  }

  const isAdmin = role === "ADMIN";
  const isActive = booking.status === "ACTIVE";

  return (
    <div className="space-y-6">
      {/* Top Bar with actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" asChild>
            <Link href={"/bookings" as never}>
              <ArrowLeft weight="light" className="mr-1 size-3.5" />
              Bookings
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="unit-code font-mono text-[18px] font-bold text-primary">
                {booking.applicationFormNo}
              </span>
              {booking.status === "ACTIVE" && (
                <Badge tone="primary">Active ({booking.paidPercent}%)</Badge>
              )}
              {booking.status === "COMPLETED" && (
                <Badge tone="available">Completed (Sold)</Badge>
              )}
              {booking.status === "RETURNED" && <Badge tone="muted">Returned</Badge>}
              {booking.status === "CANCELLED" && <Badge tone="sold">Cancelled</Badge>}
            </div>
            <p className="text-[12px] text-ink-muted">
              Serial {booking.serialNo} · {booking.registrationNo} · Unit{" "}
              {booking.unitCode}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <PdfDownloadBar
            href={`/api/documents/booking/${booking.id}/pdf`}
            printLabel="Print"
            onPrint={() => setBookingFormOpen(true)}
          />
          <DownPaymentReceiptButton
            href={`/api/documents/booking/${booking.id}/receipt.pdf`}
            signatories={signatories}
            hasPayments={payments.some((p: { isVoided?: boolean }) => !p.isVoided)}
          />
          <Button variant="secondary" size="md" asChild className="gap-1.5">
            <Link href={`/agreements?bookingId=${booking.id}` as never}>
              <FileText weight="light" className="size-4" />
              Agreement
            </Link>
          </Button>

          {isActive && (
            <Button
              variant="primary"
              size="md"
              onClick={() => setRecordPaymentOpen(true)}
              className="gap-1.5"
            >
              <Plus weight="bold" className="size-4" />
              Record Payment
            </Button>
          )}

          {isActive && isAdmin && (
            <Button
              variant="secondary"
              size="md"
              onClick={() => setReturnBookingOpen(true)}
              className="gap-1.5 text-sold hover:bg-sold/10"
            >
              <ArrowUUpLeft weight="light" className="size-4" />
              Return Booking
            </Button>
          )}
        </div>
      </div>

      {/* 3 Detail Cards: Unit, Client, Financials */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Unit Card */}
        <div className="card space-y-3 p-5">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <h4 className="text-[13px] font-semibold text-ink">Property Unit</h4>
            <Link
              href={`/units/${booking.unitId}`}
              className="unit-code font-mono text-[13px] font-bold text-primary hover:text-accent-bright hover:underline"
            >
              {formatUnitDisplayCode(booking.unitCode, booking.categoryName)}
            </Link>
          </div>
          <div className="space-y-1.5 text-[12px]">
            <div className="flex justify-between">
              <span className="text-ink-muted">Floor &amp; Block:</span>
              <span className="font-medium text-ink">
                {booking.floorName} · {booking.blockName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Category:</span>
              <span className="font-medium text-ink">{booking.categoryName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Gross Area:</span>
              <span className="font-medium text-ink tabular-nums">
                {effectivePricingArea(booking.grossAreaSqft, booking.netAreaSqft)} sq ft
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Rate / sq ft:</span>
              <span className="font-medium text-ink tabular-nums">
                {formatPkr(booking.ratePerSqftPkr)}
              </span>
            </div>
          </div>
        </div>

        {/* Client & Kin Card */}
        <div className="card space-y-3 p-5">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <h4 className="text-[13px] font-semibold text-ink">Client & Nominee</h4>
            <span className="font-mono text-[11px] text-ink-muted">
              {booking.clientCnic}
            </span>
          </div>
          <div className="space-y-1.5 text-[12px]">
            <div className="flex justify-between">
              <span className="text-ink-muted">Full Name:</span>
              <span className="font-medium text-ink">{booking.clientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">{booking.clientRelationPrefix}:</span>
              <span className="font-medium text-ink">{booking.clientRelationName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Phone:</span>
              <span className="font-medium text-ink tabular-nums">
                {booking.clientPhone}
              </span>
            </div>
            {nextOfKin && (
              <div className="flex justify-between">
                <span className="text-ink-muted">Nominee:</span>
                <span className="font-medium text-ink">
                  {nextOfKin.name} {nextOfKin.relationPrefix} {nextOfKin.relationName} (
                  {nextOfKin.relation})
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-ink-muted">Postal Address:</span>
              <span className="max-w-[160px] truncate text-ink-muted">
                {booking.postalAddress}
              </span>
            </div>
          </div>
        </div>

        {/* Financial Summary Card */}
        <div className="card space-y-3 p-5">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <h4 className="text-[13px] font-semibold text-ink">Financial Terms</h4>
            <span className="font-bold text-primary tabular-nums">
              {formatPkr(booking.netPrice)}
            </span>
          </div>
          <div className="space-y-1.5 text-[12px]">
            <div className="flex justify-between">
              <span className="text-ink-muted">Down Payment:</span>
              <span className="font-medium text-ink tabular-nums">
                {formatPkr(booking.downPayment)}
              </span>
            </div>
            {booking.tokenAdjustedAmount &&
              parseDecimal(booking.tokenAdjustedAmount) > 0n && (
                <div className="flex justify-between text-available">
                  <span>Token Adjusted:</span>
                  <span className="font-medium tabular-nums">
                    {formatPkr(booking.tokenAdjustedAmount)}
                  </span>
                </div>
              )}
            {booking.balloonTotalAmount &&
              parseDecimal(booking.balloonTotalAmount) > 0n && (
                <div className="flex justify-between">
                  <span className="text-ink-muted">Annual Balloons:</span>
                  <span className="font-medium text-ink tabular-nums">
                    {formatPkr(booking.balloonTotalAmount)}
                  </span>
                </div>
              )}
            {booking.possessionAmount && parseDecimal(booking.possessionAmount) > 0n && (
              <div className="flex justify-between">
                <span className="text-ink-muted">Possession Amount:</span>
                <span className="font-medium text-ink tabular-nums">
                  {formatPkr(booking.possessionAmount)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-ink-muted">Paid So Far:</span>
              <span className="font-semibold text-available tabular-nums">
                {formatPkr(booking.paidTotal)} ({booking.paidPercent}%)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Remaining Balance:</span>
              <span className="font-semibold text-ink tabular-nums">
                {formatPkr(booking.remainingBalancePkr)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Overdue Surcharge Due:</span>
              <span
                className={cn(
                  "font-semibold tabular-nums",
                  parseDecimal(surchargeSummary.totalNetDuePkr) > 0n
                    ? "text-sold"
                    : "text-ink-muted",
                )}
              >
                {booking.surchargeExempt
                  ? "Exempt (Removed)"
                  : formatPkr(surchargeSummary.totalNetDuePkr)}
              </span>
            </div>
            {/* Progress bar */}
            <div className="pt-1">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-subtle">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${booking.paidPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <DocumentsSection
        clientId={booking.clientId}
        kinId={nextOfKin?.id ?? null}
        documents={documents ?? []}
        initialUrls={data.signedUrls}
        urlKey={booking.id}
        role={role}
        replacePermission="bookings.create"
      />

      {/* Installment Schedule Table */}
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-subtle/40 px-5 py-3">
          <div>
            <h3 className="text-[14px] font-semibold text-ink">
              Booking Plan &amp; Payment Schedule
            </h3>
            <p className="text-[12px] text-ink-muted">
              Surcharge policy: 0.1%/day applies after 30 days past due date
              {booking.surchargeExempt
                ? ` · Surcharge Removed (${booking.surchargeExemptReason || "Admin policy"})`
                : "."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setExemptDialogOpen(true)}
                className="gap-1.5"
              >
                <ShieldCheck weight="light" className="size-3.5" />
                {booking.surchargeExempt
                  ? "Restore Surcharge Policy"
                  : "Surcharge Remove Policy"}
              </Button>
            )}
            <span className="font-mono text-[12px] text-ink-muted">
              {installments.length} entries ({booking.plan.toLowerCase()})
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[13px]">
            <thead className="border-b border-line bg-surface text-ink-muted select-none">
              <tr>
                <th className="px-5 py-2.5 font-medium">Payment Item</th>
                <th className="px-5 py-2.5 font-medium">Due Date</th>
                <th className="px-5 py-2.5 text-right font-medium">Amount</th>
                <th className="px-5 py-2.5 text-right font-medium">Paid</th>
                <th className="px-5 py-2.5 text-right font-medium">Surcharge</th>
                <th className="px-5 py-2.5 font-medium">Status</th>
                {isAdmin && (
                  <th className="px-5 py-2.5 text-right font-medium">Policy</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {installments.map((inst: any) => {
                const isOverdue = inst.status === "OVERDUE";
                const isPaid = inst.status === "PAID";
                const isPartial = inst.status === "PARTIAL";
                const sc = calculateInstallmentSurcharge({
                  amount: inst.amount,
                  paidAmount: inst.paidAmount,
                  dueDate: inst.dueDate,
                  status: inst.status,
                  surchargeWaived: inst.surchargeWaived,
                  surchargeWaivedAmount: inst.surchargeWaivedAmount,
                  surchargePaidAmount: inst.surchargePaidAmount,
                  bookingSurchargeExempt: Boolean(booking.surchargeExempt),
                });
                const hasSurchargeDue = parseDecimal(sc.netDuePkr) > 0n;

                return (
                  <tr
                    key={inst.id}
                    className={cn(
                      "transition-colors",
                      isOverdue && "bg-sold/5 text-sold",
                      !isOverdue && "hover:bg-subtle/30",
                    )}
                  >
                    <td className="px-5 py-2.5 font-medium">
                      <div className="flex items-center gap-2">
                        <span>{inst.label || `Installment ${inst.seq}`}</span>
                        {inst.type === "BALLOON" && <Badge tone="accent">Balloon</Badge>}
                        {inst.type === "POSSESSION" && (
                          <Badge tone="primary">Possession</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-2.5 font-sans tabular-nums">
                      {new Date(inst.dueDate).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-2.5 text-right font-medium tabular-nums">
                      {formatPkr(inst.amount)}
                    </td>
                    <td className="px-5 py-2.5 text-right font-medium text-available tabular-nums">
                      {formatPkr(inst.paidAmount)}
                    </td>
                    <td className="px-5 py-2.5 text-right tabular-nums">
                      {hasSurchargeDue ? (
                        <div>
                          <span className="font-semibold text-sold">
                            {formatPkr(sc.netDuePkr)}
                          </span>
                          <p className="text-[10px] text-ink-muted">
                            {sc.chargeableDays}d beyond 30d grace
                          </p>
                        </div>
                      ) : sc.isExemptOrWaived && parseDecimal(sc.rawAccruedPkr) > 0n ? (
                        <span className="text-[11px] text-ink-muted line-through">
                          {formatPkr(sc.rawAccruedPkr)} (Waived)
                        </span>
                      ) : (
                        <span className="text-[11px] text-ink-muted">—</span>
                      )}
                    </td>
                    <td className="px-5 py-2.5">
                      {isPaid && <Badge tone="available">Paid</Badge>}
                      {isPartial && <Badge tone="primary">Partial</Badge>}
                      {inst.status === "PENDING" && <Badge tone="muted">Pending</Badge>}
                      {isOverdue && (
                        <Badge tone="sold" className="animate-pulse">
                          Overdue
                        </Badge>
                      )}
                      {inst.status === "CANCELLED" && (
                        <Badge tone="muted">Cancelled</Badge>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="px-5 py-2.5 text-right">
                        {hasSurchargeDue ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setWaiveTarget(inst);
                              setWaiveReason("");
                            }}
                          >
                            Waive
                          </Button>
                        ) : (
                          <span className="text-[11px] text-ink-faint">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payments Ledger Table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line bg-subtle/40 px-5 py-3">
          <div>
            <h3 className="text-[14px] font-semibold text-ink">Payments Ledger</h3>
            <p className="text-[12px] text-ink-muted">
              Receipted payments received against this booking.
            </p>
          </div>
          <span className="font-mono text-[12px] text-ink-muted">
            {payments.length} receipts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[13px]">
            <thead className="border-b border-line bg-surface text-ink-muted select-none">
              <tr>
                <th className="px-5 py-2.5 font-medium">Receipt No</th>
                <th className="px-5 py-2.5 font-medium">Date</th>
                <th className="px-5 py-2.5 text-right font-medium">Amount</th>
                <th className="px-5 py-2.5 font-medium">Method</th>
                <th className="px-5 py-2.5 font-medium">Received By</th>
                <th className="px-5 py-2.5 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-ink-muted">
                    No payments recorded yet.
                  </td>
                </tr>
              ) : (
                payments.map((p: any) => (
                  <tr key={p.id} className="hover:bg-subtle/30">
                    <td className="px-5 py-2.5 font-mono font-semibold text-primary">
                      {p.receiptNo}
                    </td>
                    <td className="px-5 py-2.5 font-sans text-ink tabular-nums">
                      {new Date(p.paidAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-2.5 text-right font-bold text-available tabular-nums">
                      {formatPkr(p.amount)}
                    </td>
                    <td className="px-5 py-2.5">
                      <span className="font-medium text-ink">{p.method}</span>
                      {p.chequeNo && (
                        <p className="text-[11px] text-ink-muted">
                          {p.chequeNo} ({p.bank})
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-2.5 text-ink-muted">
                      {p.receivedByName || "Cashier"}
                    </td>
                    <td className="px-5 py-2.5 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          setActiveReceipt({
                            ...p,
                            clientName: booking.clientName,
                            clientCnic: booking.clientCnic,
                            clientPhone: booking.clientPhone,
                            unitCode: booking.unitCode,
                            bookingNo: booking.bookingNo,
                            amountPkr: p.amount,
                          })
                        }
                        className="gap-1"
                      >
                        <Printer weight="light" className="size-3.5" />
                        Receipt
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Refunds History if Returned */}
      {refunds && refunds.length > 0 && (
        <div className="card overflow-hidden border-sold/20">
          <div className="border-b border-sold/20 bg-sold/5 px-5 py-3">
            <h3 className="text-[14px] font-semibold text-sold">Refunds & Reversals</h3>
          </div>
          <div className="space-y-3 p-4">
            {refunds.map((ref: any) => (
              <div
                key={ref.id}
                className="flex items-center justify-between rounded-[8px] border border-line bg-subtle/30 p-3 text-[12px]"
              >
                <div>
                  <span className="font-semibold text-ink">
                    Refund Issued: {formatPkr(ref.refundAmount)}
                  </span>
                  <p className="text-ink-muted">
                    Deduction: {formatPkr(ref.deduction)} · Method: {ref.method}
                  </p>
                  <p className="mt-1 text-ink-muted italic">Reason: {ref.reason}</p>
                </div>
                <div className="text-right">
                  <span className="text-ink-muted">
                    Approved by {ref.approvedByName || "Admin"}
                  </span>
                  <p className="text-[11px] text-ink-muted">
                    {new Date(ref.paidAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Record Payment Dialog with Live Allocation Preview */}
      <Dialog open={recordPaymentOpen} onOpenChange={setRecordPaymentOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="payment-amount" className="text-[12px]">
                  Amount (PKR) <span className="text-sold">*</span>
                </Label>
                <MoneyInput
                  id="payment-amount"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="e.g. 50,000"
                  className="tabular-nums"
                  autoFocus
                />
              </div>

              <div>
                <Label htmlFor="pay-mthd" className="text-[12px]">
                  Payment Method
                </Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(val) => setPaymentMethod(val as PaymentMethod)}
                >
                  <SelectTrigger id="pay-mthd">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="CHEQUE">Cheque</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Online</SelectItem>
                    <SelectItem value="PAY_ORDER">Pay Order</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(paymentMethod === "CHEQUE" ||
              paymentMethod === "BANK_TRANSFER" ||
              paymentMethod === "PAY_ORDER") && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="chq-no" className="text-[12px]">
                    Instrument / Cheque No
                  </Label>
                  <Input
                    id="chq-no"
                    value={chequeNo}
                    onChange={(e) => setChequeNo(e.target.value)}
                    placeholder="e.g. 87654321"
                  />
                </div>
                <div>
                  <Label htmlFor="bank-nm" className="text-[12px]">
                    Bank Name
                  </Label>
                  <Input
                    id="bank-nm"
                    value={bank}
                    onChange={(e) => setBank(e.target.value)}
                    placeholder="e.g. Meezan Bank"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pay-dt" className="text-[12px]">
                  Payment Date
                </Label>
                <Input
                  id="pay-dt"
                  type="date"
                  value={paidAt}
                  onChange={(e) => setPaidAt(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="pay-notes" className="text-[12px]">
                  Notes
                </Label>
                <Input
                  id="pay-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional remark"
                />
              </div>
            </div>

            {/* Live Allocation Preview Box */}
            {allocationPreview && (
              <div className="space-y-2 rounded-[8px] border border-primary/20 bg-primary/5 p-3.5">
                <span className="block text-[12px] font-semibold tracking-wide text-primary uppercase">
                  Live Payment Allocation Preview
                </span>
                <div className="max-h-40 space-y-1 overflow-y-auto text-[12px]">
                  {allocationPreview.allocations.length === 0 ? (
                    <p className="text-ink-muted">No pending installments to allocate.</p>
                  ) : (
                    allocationPreview.allocations.map((alloc) => (
                      <div
                        key={alloc.installmentId}
                        className="flex items-center justify-between border-b border-line/40 py-1"
                      >
                        <span>Installment {alloc.seq}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-ink tabular-nums">
                            +{formatPkr(alloc.allocatedPkr)}
                          </span>
                          <Badge
                            tone={alloc.newStatus === "PAID" ? "available" : "primary"}
                          >
                            {alloc.newStatus}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {allocationPreview.isCompleted && (
                  <div className="mt-2 rounded bg-available/10 p-2 text-center text-[12px] font-bold text-available">
                    🎉 This payment completes the booking (100% paid). Unit will
                    automatically transition to SOLD!
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setRecordPaymentOpen(false)}
              disabled={isSubmittingPayment}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleRecordPayment}
              disabled={isSubmittingPayment || !paymentAmount}
            >
              {isSubmittingPayment ? "Recording..." : "Confirm Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Booking Dialog */}
      <Dialog open={returnBookingOpen} onOpenChange={setReturnBookingOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Return Booking & Process Refund</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-[13px]">
            <div className="rounded-[8px] bg-subtle/50 p-3">
              <span className="block text-[11px] text-ink-muted uppercase">
                Paid Total So Far
              </span>
              <p className="text-[16px] font-bold text-ink tabular-nums">
                {formatPkr(booking.paidTotal)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[12px]">Deduction Type</Label>
                <Select
                  value={deductionType}
                  onValueChange={(val) => setDeductionType(val as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENT">Percentage (%)</SelectItem>
                    <SelectItem value="AMOUNT">Fixed Amount (PKR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[12px]">Deduction Value</Label>
                {deductionType === "AMOUNT" ? (
                  <MoneyInput
                    value={deductionValue}
                    onChange={(e) => setDeductionValue(e.target.value)}
                    placeholder="e.g. 50,000"
                    className="tabular-nums"
                  />
                ) : (
                  <Input
                    value={deductionValue}
                    onChange={(e) => setDeductionValue(e.target.value)}
                    placeholder="e.g. 10"
                    className="tabular-nums"
                  />
                )}
              </div>
            </div>

            {/* Live Refund Preview */}
            <div className="flex items-center justify-between rounded-[8px] border border-line bg-white p-3">
              <div>
                <span className="block text-[11px] text-ink-muted">
                  Calculated Refund
                </span>
                <span className="text-[16px] font-bold text-primary tabular-nums">
                  {formatPkr(refundPreview.refundAmountPkr)}
                </span>
              </div>
              <div className="text-right text-[11px] text-ink-muted">
                Deduction: {formatPkr(refundPreview.deductionPkr)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[12px]">Refund Payment Method</Label>
                <Select
                  value={refundMethod}
                  onValueChange={(val) => setRefundMethod(val as PaymentMethod)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CHEQUE">Crossed Cheque</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    <SelectItem value="CASH">Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[12px]">Cheque / Instrument No</Label>
                <Input
                  value={refundChequeNo}
                  onChange={(e) => setRefundChequeNo(e.target.value)}
                  placeholder="e.g. 1029384"
                />
              </div>
            </div>

            <div>
              <Label className="text-[12px]">
                Cancellation Reason <span className="text-sold">* (min 10 chars)</span>
              </Label>
              <Input
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="Reason for client return or contract cancellation"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setReturnBookingOpen(false)}
              disabled={isSubmittingReturn}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleReturnBooking}
              disabled={isSubmittingReturn || returnReason.trim().length < 10}
              className="bg-sold hover:bg-sold/90"
            >
              {isSubmittingReturn ? "Processing..." : "Approve Return & Release Unit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Printable Booking Form Dialog */}
      <PrintableBookingFormDialog
        open={bookingFormOpen}
        onOpenChange={setBookingFormOpen}
        bookingDetail={data}
      />

      {/* Printable Receipt Dialog */}
      <PrintableReceiptDialog
        open={Boolean(activeReceipt)}
        onOpenChange={(open) => !open && setActiveReceipt(null)}
        receipt={activeReceipt}
      />

      {/* Waive Installment Surcharge Dialog (ADMIN) */}
      <Dialog
        open={Boolean(waiveTarget)}
        onOpenChange={(open) => !open && setWaiveTarget(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Waive Overdue Surcharge</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-[13px]">
            <p className="text-ink-muted">
              Remove accrued late-payment surcharge for{" "}
              <strong className="text-ink">
                {waiveTarget?.label || `Installment #${waiveTarget?.seq}`}
              </strong>
              . This action is logged in the audit trail.
            </p>
            <div>
              <Label className="mb-1 block text-[12px]">Waiver Reason *</Label>
              <Input
                value={waiveReason}
                onChange={(e) => setWaiveReason(e.target.value)}
                placeholder="e.g. Management waiver approved for lump-sum settlement"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setWaiveTarget(null)}
              disabled={waiving}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmWaiveSurcharge}
              disabled={waiving || waiveReason.trim().length < 5}
            >
              {waiving ? "Waiving…" : "Confirm Waiver"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Booking Surcharge Remove Policy Dialog (ADMIN) */}
      <Dialog open={exemptDialogOpen} onOpenChange={setExemptDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {booking.surchargeExempt
                ? "Restore Surcharge Policy"
                : "Apply Surcharge Remove Policy"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-[13px]">
            <p className="text-ink-muted">
              {booking.surchargeExempt
                ? "Re-enable the standard 0.1%/day late-payment surcharge after 30 days overdue on this booking."
                : "Remove/exempt late-payment surcharges across all installments of this booking. Logged in audit trail."}
            </p>
            <div>
              <Label className="mb-1 block text-[12px]">Policy Reason *</Label>
              <Input
                value={exemptReason}
                onChange={(e) => setExemptReason(e.target.value)}
                placeholder="e.g. Director-approved surcharge waiver policy"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setExemptDialogOpen(false)}
              disabled={togglingExempt}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleToggleSurchargePolicy}
              disabled={togglingExempt || exemptReason.trim().length < 5}
            >
              {togglingExempt ? "Saving…" : "Confirm Policy Change"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
