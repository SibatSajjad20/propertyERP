/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUUpLeft,
  Check,
  CheckCircle,
  CurrencyDollar,
  DotsThree,
  DownloadSimple,
  FileText,
  IdentificationBadge,
  IdentificationCard,
  Plus,
  Printer,
  Receipt,
  ShieldCheck,
  User,
  Warning,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { StatStrip, StatCell } from "@/components/ui/stat-strip";
import { Panel } from "@/components/ui/panel";
import { Pill, Badge } from "@/components/ui/badge";
import { DefinitionList } from "@/components/ui/definition-list";
import { ActivityList, type ActivityItem } from "@/components/ui/activity-list";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
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
import { formatDecimal, formatPkr, parseDecimal } from "@/lib/money";
import { cn } from "@/lib/cn";
import { toast } from "sonner";
import type { UserRole, PaymentMethod, DocumentType } from "@/db/schema/enums";
import { recordPayment, returnBooking } from "../actions";
import { allocatePayment, calculateRefund } from "../calculator";
import { getPaymentAllocationLabel } from "@/features/installments/calculator";
import {
  calculateInstallmentSurcharge,
  summarizeBookingSurcharges,
} from "@/features/installments/surcharge";
import {
  toggleBookingSurchargeExemption,
  waiveInstallmentSurcharge,
} from "@/features/installments/actions";
import { DocumentsSection } from "@/features/documents/components/documents-section";
import { PrintableReceiptDialog } from "./printable-documents";
import {
  CLIENT_ALL_DOC_TYPES,
  DOC_TYPE_LABELS,
  KIN_ALL_DOC_TYPES,
} from "@/features/documents/constants";
import { currentDocuments } from "@/features/documents/required";

interface BookingDetailScreenProps {
  data: any;
  role: UserRole;
  signatories?: Array<{ id: string; name: string; designation: string }>;
  initialTab?: string;
}

export function BookingDetailScreen({
  data,
  role,
  signatories = [],
  initialTab = "overview",
}: BookingDetailScreenProps) {
  const router = useRouter();
  const { booking, nextOfKin, installments, payments, refunds, documents } = data;

  const validTabs = ["overview", "schedule", "documents", "activity"];
  const [activeTab, setActiveTab] = React.useState(() => {
    return validTabs.includes(initialTab) ? initialTab : "overview";
  });

  function handleTabChange(tab: string) {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.replaceState(null, "", url.toString());
  }

  // Appendix toggle state
  const [appendix, setAppendix] = React.useState(true);
  const pdfViewUrl = `/api/documents/booking/${booking.id}/pdf?appendix=${appendix ? "1" : "0"}`;
  const pdfDownloadUrl = `/api/documents/booking/${booking.id}/pdf?appendix=${appendix ? "1" : "0"}&download=1`;

  // Dialog states
  const [recordPaymentOpen, setRecordPaymentOpen] = React.useState(false);
  const [returnBookingOpen, setReturnBookingOpen] = React.useState(false);
  const [activeReceipt, setActiveReceipt] = React.useState<any>(null);
  const [downPaymentModalOpen, setDownPaymentModalOpen] = React.useState(false);
  const [selectedSignatoryId, setSelectedSignatoryId] = React.useState(
    signatories[0]?.id ?? "",
  );

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
          : "Standard 0.05%/day surcharge policy restored.",
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
  const [deductionValue, setDeductionValue] = React.useState("10"); // default 10%
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

  // Document numbers and map
  const activeDocs = React.useMemo(() => {
    return currentDocuments(documents ?? []);
  }, [documents]);

  const totalPossibleDocs = React.useMemo(() => {
    return CLIENT_ALL_DOC_TYPES.length + (nextOfKin ? KIN_ALL_DOC_TYPES.length : 0);
  }, [nextOfKin]);

  // Next installment calculation
  const nextInstallment = React.useMemo(() => {
    return installments.find(
      (i: any) =>
        parseDecimal(i.amount) > parseDecimal(i.paidAmount || "0") &&
        i.status !== "CANCELLED",
    );
  }, [installments]);

  const nextInstDueDiffDays = React.useMemo(() => {
    if (!nextInstallment) return null;
    const dueDate = new Date(nextInstallment.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    const diffTime = dueDate.getTime() - today.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  }, [nextInstallment]);

  let nextInstSubline = "All paid";
  if (nextInstallment && nextInstDueDiffDays !== null) {
    const formattedDate = new Date(nextInstallment.dueDate).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    });
    if (nextInstDueDiffDays < 0) {
      nextInstSubline = `${formattedDate} · ${Math.abs(nextInstDueDiffDays)} days late`;
    } else if (nextInstDueDiffDays === 0) {
      nextInstSubline = `${formattedDate} · Due today`;
    } else {
      nextInstSubline = `${formattedDate} · in ${nextInstDueDiffDays} days`;
    }
  }

  // Overdue calculation derived client-side
  const overdueSummary = React.useMemo(() => {
    let sumPaisa = 0n;
    let count = 0;
    for (const inst of installments) {
      if (inst.status === "OVERDUE") {
        const remaining =
          parseDecimal(inst.amount) - parseDecimal(inst.paidAmount || "0");
        if (remaining > 0n) {
          sumPaisa += remaining;
          count++;
        }
      }
    }
    return { sumPaisa, sumPkr: formatDecimal(sumPaisa), count };
  }, [installments]);

  // Activity events assembled from existing data
  const activityItems: ActivityItem[] = React.useMemo(() => {
    const items: ActivityItem[] = [];

    // 1. Booking created
    if (booking.createdAt) {
      items.push({
        id: `created-${booking.id}`,
        title: "Booking Created",
        subLine: `Application form #${booking.applicationFormNo} registered for Unit ${booking.unitCode}`,
        time: new Date(booking.createdAt).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        active: true,
      });
    }

    // 2. Payments
    for (const p of payments) {
      items.push({
        id: `payment-${p.id}`,
        title: `Payment Received: ${formatPkr(p.amount)}`,
        subLine: `Receipt #${p.receiptNo} via ${p.method}${p.receivedByName ? ` (${p.receivedByName})` : ""}`,
        time: new Date(p.paidAt).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        active: true,
      });
    }

    // 3. Document uploads
    for (const d of documents ?? []) {
      const typeLabel = DOC_TYPE_LABELS[d.docType as DocumentType] || d.docType;
      items.push({
        id: `doc-${d.id}`,
        title: `Document Uploaded: ${typeLabel}`,
        subLine: `${d.ownerType === "CLIENT" ? "Applicant" : "Nominee"} document verified`,
        time: d.createdAt
          ? new Date(d.createdAt).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "—",
      });
    }

    // 4. Refunds
    for (const r of refunds ?? []) {
      items.push({
        id: `refund-${r.id}`,
        title: `Refund Processed: ${formatPkr(r.refundAmount)}`,
        subLine: `Deduction: ${formatPkr(r.deduction)} · Reason: ${r.reason}`,
        time: new Date(r.paidAt).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
      });
    }

    return items;
  }, [booking, payments, documents, refunds]);

  // Pill tone
  const statusTone =
    booking.status === "ACTIVE"
      ? "primary"
      : booking.status === "COMPLETED"
        ? "available"
        : booking.status === "CANCELLED"
          ? "sold"
          : "neutral";

  return (
    <div className="space-y-6">
      {/* PageHeader with Actions */}
      <PageHeader
        title={booking.bookingNo || booking.applicationFormNo}
        idTitle={true}
        back={{ label: "Bookings", href: "/bookings" }}
        badge={
          <Pill tone={statusTone}>
            {booking.status} · {booking.paidPercent}% paid
          </Pill>
        }
        meta={[
          `Serial #${booking.serialNo}`,
          booking.applicationFormNo,
          `Unit ${booking.unitCode}`,
          `Booked ${new Date(booking.createdAt).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}`,
        ]}
        actions={
          <div className="flex items-center gap-2">
            {/* More dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="md" className="gap-1.5">
                  <DotsThree weight="bold" className="size-4" />
                  More
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <a href={pdfViewUrl} target="_blank" rel="noopener noreferrer">
                    <Printer weight="light" className="mr-2 size-4 text-ink-muted" />
                    Print
                  </a>
                </DropdownMenuItem>

                <DropdownMenuCheckboxItem
                  checked={appendix}
                  onCheckedChange={setAppendix}
                >
                  Include CNIC appendix
                </DropdownMenuCheckboxItem>

                <DropdownMenuItem
                  onClick={() => setDownPaymentModalOpen(true)}
                  disabled={
                    !payments.some((p: { isVoided?: boolean }) => !p.isVoided) ||
                    signatories.length === 0
                  }
                >
                  <Receipt weight="light" className="mr-2 size-4 text-ink-muted" />
                  Down payment receipt
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link href={`/agreements?bookingId=${booking.id}` as never}>
                    <FileText weight="light" className="mr-2 size-4 text-ink-muted" />
                    Agreement
                  </Link>
                </DropdownMenuItem>

                {isActive && isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="danger"
                      onClick={() => setReturnBookingOpen(true)}
                    >
                      <ArrowUUpLeft weight="light" className="mr-2 size-4 text-sold" />
                      Return Booking
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Download PDF button */}
            <Button variant="secondary" size="md" asChild className="gap-1.5">
              <a href={pdfDownloadUrl} download>
                <DownloadSimple weight="light" className="size-4" />
                Download PDF
              </a>
            </Button>

            {/* Record Payment primary button */}
            {isActive && (
              <Button
                variant="primary"
                size="md"
                onClick={() => setRecordPaymentOpen(true)}
                className="gap-1.5"
              >
                <Plus weight="bold" className="size-4" />
                Record payment
              </Button>
            )}
          </div>
        }
      />

      {/* 5-Cell StatStrip */}
      <StatStrip columns="1.05fr 1.05fr 1.15fr 1.05fr 1.15fr">
        {/* Cell 1: Total Price */}
        <StatCell
          label="TOTAL PRICE"
          value={formatPkr(booking.netPrice)}
          valueClassName="whitespace-nowrap text-[22px] xl:text-[24px] 2xl:text-[26px]"
          subLine={`${booking.categoryName} ${booking.unitCode} · ${effectivePricingArea(booking.grossAreaSqft, booking.netAreaSqft)} sq ft`}
        />

        {/* Cell 2: Paid So Far */}
        <StatCell
          label="PAID SO FAR"
          value={formatPkr(booking.paidTotal)}
          valueClassName="whitespace-nowrap text-[22px] xl:text-[24px] 2xl:text-[26px]"
          subLine={`${booking.paidPercent}% paid`}
          progress={Number(booking.paidPercent) || 0}
        />

        {/* Cell 3: Remaining */}
        <StatCell
          label="REMAINING"
          value={formatPkr(booking.remainingBalancePkr)}
          valueClassName="whitespace-nowrap text-[21px] xl:text-[23px] 2xl:text-[25px]"
          subLine={
            parseDecimal(booking.possessionAmount || "0") > 0n
              ? `incl. possession ${formatPkr(booking.possessionAmount)}`
              : "—"
          }
        />

        {/* Cell 4: Next Installment */}
        <StatCell
          label="NEXT INSTALLMENT"
          value={nextInstallment ? formatPkr(nextInstallment.amount) : "Fully Settled"}
          valueClassName="whitespace-nowrap text-[22px] xl:text-[24px] 2xl:text-[26px]"
          subLine={nextInstSubline}
        />

        {/* Cell 5: Overdue */}
        <StatCell
          label="OVERDUE"
          valueClassName="whitespace-nowrap"
          value={
            overdueSummary.sumPaisa > 0n ? (
              <span className="text-[21px] whitespace-nowrap text-sold xl:text-[23px] 2xl:text-[25px]">
                {formatPkr(overdueSummary.sumPkr)}
              </span>
            ) : (
              <span className="text-[19px] whitespace-nowrap text-available xl:text-[21px] 2xl:text-[23px]">
                Nothing overdue
              </span>
            )
          }
          subLine={
            overdueSummary.sumPaisa > 0n
              ? `${overdueSummary.count} installments late`
              : "All current"
          }
        />
      </StatStrip>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="border-b border-line">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="schedule">
            Payment schedule ({installments.length})
          </TabsTrigger>
          <TabsTrigger value="documents">
            Documents ({activeDocs.length}/{totalPossibleDocs})
          </TabsTrigger>
          <TabsTrigger value="activity">Activity ({activityItems.length})</TabsTrigger>
        </TabsList>

        {/* 1. Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Property Unit Details */}
            <Panel
              title="Property Unit"
              actions={
                <Link
                  href={`/units/${booking.unitId}`}
                  className="text-[12.5px] font-medium text-primary hover:underline"
                >
                  View Unit
                </Link>
              }
            >
              <DefinitionList
                items={[
                  {
                    label: "Unit Code",
                    value: (
                      <span className="font-sans font-medium text-ink tabular-nums">
                        {formatUnitDisplayCode(booking.unitCode, booking.categoryName)}
                      </span>
                    ),
                  },
                  {
                    label: "Floor / Block",
                    value: `${booking.floorName} · ${booking.blockName}`,
                  },
                  {
                    label: "Category",
                    value: booking.categoryName,
                  },
                  {
                    label: "Gross Area",
                    value: (
                      <span className="tabular-nums">
                        {effectivePricingArea(booking.grossAreaSqft, booking.netAreaSqft)}{" "}
                        sq ft
                      </span>
                    ),
                  },
                  {
                    label: "Rate / sq ft",
                    value: (
                      <span className="tabular-nums">
                        {formatPkr(booking.ratePerSqftPkr)}
                      </span>
                    ),
                  },
                  {
                    label: "List Price",
                    value: (
                      <span className="font-semibold text-ink tabular-nums">
                        {formatPkr(booking.listPrice)}
                      </span>
                    ),
                  },
                ]}
              />
            </Panel>

            {/* Applicant Details along with Nominee Details */}
            <Panel title="Applicant Details">
              <div className="space-y-5">
                <div>
                  <h4 className="mb-2 text-[11px] font-semibold tracking-wide text-ink-muted uppercase">
                    Applicant Information
                  </h4>
                  <DefinitionList
                    items={[
                      {
                        label: "Full Name",
                        value: `${booking.clientTitle ? `${booking.clientTitle} ` : ""}${booking.clientName}`,
                      },
                      {
                        label: `${booking.clientRelationPrefix || "S/O"}`,
                        value: booking.clientRelationName,
                      },
                      {
                        label: "CNIC",
                        value: (
                          <span className="font-sans font-medium text-ink tabular-nums">
                            {booking.clientCnic}
                          </span>
                        ),
                      },
                      {
                        label: "Phone",
                        value: (
                          <span className="tabular-nums">{booking.clientPhone}</span>
                        ),
                      },
                      {
                        label: "Home Address",
                        value: (
                          <span className="break-words text-ink">
                            {booking.homeAddress}
                          </span>
                        ),
                      },
                      {
                        label: "Postal Address",
                        value: (
                          <span className="break-words text-ink">
                            {booking.postalAddress}
                          </span>
                        ),
                      },
                    ]}
                  />
                </div>

                <div className="border-t border-line pt-4">
                  <h4 className="mb-2 text-[11px] font-semibold tracking-wide text-ink-muted uppercase">
                    Nominee Details
                  </h4>
                  {nextOfKin ? (
                    <DefinitionList
                      items={[
                        {
                          label: "Nominee Name",
                          value: nextOfKin.name,
                        },
                        {
                          label: "Relation",
                          value: nextOfKin.relation,
                        },
                        ...(nextOfKin.relationName
                          ? [
                              {
                                label: nextOfKin.relationPrefix || "S/O",
                                value: nextOfKin.relationName,
                              },
                            ]
                          : []),
                        ...(nextOfKin.cnic
                          ? [
                              {
                                label: "CNIC",
                                value: (
                                  <span className="font-sans font-medium text-ink tabular-nums">
                                    {nextOfKin.cnic}
                                  </span>
                                ),
                              },
                            ]
                          : []),
                        ...(nextOfKin.phone
                          ? [
                              {
                                label: "Phone",
                                value: (
                                  <span className="tabular-nums">{nextOfKin.phone}</span>
                                ),
                              },
                            ]
                          : []),
                        ...(nextOfKin.address
                          ? [
                              {
                                label: "Address",
                                value: (
                                  <span className="break-words text-ink">
                                    {nextOfKin.address}
                                  </span>
                                ),
                              },
                            ]
                          : []),
                      ]}
                    />
                  ) : (
                    <p className="text-[12.5px] text-ink-muted">
                      No nominee registered for this booking.
                    </p>
                  )}
                </div>
              </div>
            </Panel>
          </div>
        </TabsContent>

        {/* 2. Payment Schedule Tab */}
        <TabsContent value="schedule" className="space-y-6">
          {/* Surcharge policy and exempt controls */}
          <div className="card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-subtle/40 px-5 py-3">
              <div>
                <h3 className="text-[14px] font-semibold text-ink">
                  Payment Schedule &amp; Overdue Status
                </h3>
                <p className="text-[12px] text-ink-muted">
                  Surcharge policy: 0.05%/day applies after 30 days past due date
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
                <span className="font-sans text-[12px] text-ink-muted tabular-nums">
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
                          !isOverdue && "hover:bg-[#F8FAFC]",
                        )}
                      >
                        <td className="px-5 py-2.5 font-medium">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                              <span>{inst.label || `Installment ${inst.seq}`}</span>
                              {inst.type === "BALLOON" && (
                                <Badge tone="accent">Balloon</Badge>
                              )}
                              {inst.type === "POSSESSION" && (
                                <Badge tone="primary">Possession</Badge>
                              )}
                            </div>
                            {inst.receiptNos && (
                              <span className="text-[11px] font-normal text-ink-muted">
                                Paid via Receipt: {inst.receiptNos}
                              </span>
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
                                {sc.chargeableDays}d late
                              </p>
                            </div>
                          ) : sc.isExemptOrWaived &&
                            parseDecimal(sc.rawAccruedPkr) > 0n ? (
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
                          {inst.status === "PENDING" && (
                            <Badge tone="muted">Pending</Badge>
                          )}
                          {isOverdue && <Badge tone="sold">Overdue</Badge>}
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
              <span className="font-sans text-[12px] text-ink-muted tabular-nums">
                {payments.length} receipts
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-[13px]">
                <thead className="border-b border-line bg-surface text-ink-muted select-none">
                  <tr>
                    <th className="px-5 py-2.5 font-medium">Receipt No</th>
                    <th className="px-5 py-2.5 font-medium">Paid For</th>
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
                      <td colSpan={7} className="p-6 text-center text-ink-muted">
                        No payments recorded yet.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p: any) => (
                      <tr key={p.id} className="hover:bg-[#F8FAFC]">
                        <td className="px-5 py-2.5 font-sans font-semibold text-primary tabular-nums">
                          {p.receiptNo}
                        </td>
                        <td className="px-5 py-2.5">
                          <Badge
                            tone={
                              p.category === "DOWN_PAYMENT"
                                ? "primary"
                                : p.category === "SURCHARGE"
                                  ? "sold"
                                  : "neutral"
                            }
                          >
                            {getPaymentAllocationLabel(p, installments)}
                          </Badge>
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
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() =>
                                window.open(
                                  `/api/documents/payment/${p.id}/pdf`,
                                  "_blank",
                                )
                              }
                              className="gap-1 text-[12px]"
                              title="Open PDF Receipt"
                            >
                              <FileText weight="light" className="size-3.5" />
                              <span>PDF</span>
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() =>
                                setActiveReceipt({
                                  ...p,
                                  id: p.id,
                                  clientName: booking.clientName,
                                  clientCnic: booking.clientCnic,
                                  clientPhone: booking.clientPhone,
                                  unitCode: booking.unitCode,
                                  bookingNo: booking.bookingNo,
                                  amountPkr: p.amount,
                                })
                              }
                              className="gap-1 text-[12px]"
                            >
                              <Printer weight="light" className="size-3.5" />
                              <span>Receipt</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Refunds & Reversals Card */}
          {refunds && refunds.length > 0 && (
            <div className="card overflow-hidden border-sold/20">
              <div className="border-b border-sold/20 bg-sold/5 px-5 py-3">
                <h3 className="text-[14px] font-semibold text-sold">
                  Refunds & Reversals
                </h3>
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
        </TabsContent>

        {/* 3. Documents Tab */}
        <TabsContent value="documents" className="space-y-6">
          <DocumentsSection
            clientId={booking.clientId}
            kinId={nextOfKin?.id ?? null}
            documents={documents ?? []}
            initialUrls={data.signedUrls}
            urlKey={booking.id}
            role={role}
            replacePermission="bookings.create"
          />
        </TabsContent>

        {/* 4. Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Panel
            title="Complete Booking History"
            hint={`${activityItems.length} ledger events`}
          >
            <ActivityList items={activityItems} />
          </Panel>
        </TabsContent>
      </Tabs>

      {/* Down Payment Receipt Signatory Dialog */}
      <Dialog open={downPaymentModalOpen} onOpenChange={setDownPaymentModalOpen}>
        <DialogContent className="max-w-md rounded-[16px]">
          <DialogHeader>
            <DialogTitle>Download down payment receipt</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label className="mb-1 block text-[12px]">Authorized signatory</Label>
            <Select value={selectedSignatoryId} onValueChange={setSelectedSignatoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Select signatory" />
              </SelectTrigger>
              <SelectContent>
                {signatories.map((row) => (
                  <SelectItem key={row.id} value={row.id}>
                    {row.name} — {row.designation}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDownPaymentModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              asChild
              onClick={() => setDownPaymentModalOpen(false)}
            >
              <a
                href={`/api/documents/booking/${booking.id}/receipt.pdf?signatory=${encodeURIComponent(selectedSignatoryId || signatories[0]?.id || "")}`}
                download
              >
                <DownloadSimple weight="light" className="mr-1.5 size-4" />
                Download
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
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
                <div className="mt-1">
                  <DatePicker
                    id="pay-dt"
                    value={paidAt}
                    onChange={(val) => setPaidAt(val)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="pay-notes" className="text-[12px]">
                  Notes
                </Label>
                <div className="mt-1">
                  <Input
                    id="pay-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional remark"
                  />
                </div>
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
                ? "Re-enable the standard 0.05%/day late-payment surcharge after 30 days overdue on this booking."
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
