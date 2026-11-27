"use client";

import * as React from "react";
import {
  Printer,
  DownloadSimple,
  X,
  FileText,
  User,
  Buildings,
  CurrencyDollar,
  CheckCircle,
  Warning,
  Eye,
  SlidersHorizontal,
} from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/badge";
import { formatPkr } from "@/lib/money";
import { cn } from "@/lib/cn";
import type { ClientLedgerReportData, ClientLedgerScheduleRow } from "../queries";

export interface OverdueNoticeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ledgerData: ClientLedgerReportData;
  initialInstallment?: ClientLedgerScheduleRow | null;
  currentUserName?: string | null;
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date)
    return new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return String(date);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function resolveMilestoneWord(label: string, seq?: number): string {
  const l = (label || "").trim().toLowerCase();
  if (l.includes("down") || l.includes("booking")) return "down payment";
  if (seq === 1 || l.startsWith("1st") || l.includes("first")) return "first installment";
  if (seq === 2 || l.startsWith("2nd") || l.includes("second"))
    return "second installment";
  if (seq === 3 || l.startsWith("3rd") || l.includes("third")) return "third installment";
  if (seq === 4 || l.startsWith("4th") || l.includes("fourth"))
    return "fourth installment";
  if (seq === 5 || l.startsWith("5th") || l.includes("fifth")) return "fifth installment";
  if (seq === 6 || l.startsWith("6th") || l.includes("sixth")) return "sixth installment";
  if (seq === 7 || l.startsWith("7th") || l.includes("seventh"))
    return "seventh installment";
  if (seq === 8 || l.startsWith("8th") || l.includes("eighth"))
    return "eighth installment";
  if (seq === 9 || l.startsWith("9th") || l.includes("ninth")) return "ninth installment";
  if (seq === 10 || l.startsWith("10th") || l.includes("tenth"))
    return "tenth installment";
  return label.toLowerCase() || "installment";
}

export function OverdueNoticeDialog({
  open,
  onOpenChange,
  ledgerData,
  initialInstallment,
  currentUserName,
}: OverdueNoticeDialogProps) {
  const client = ledgerData.client;
  const unit = ledgerData.selectedUnitDetails || {
    unitId: ledgerData.units[0]?.unitId || "",
    unitCode: ledgerData.units[0]?.unitCode || "—",
    floorName: ledgerData.units[0]?.floorName || "—",
    categoryName: ledgerData.units[0]?.categoryName || "Unit",
    grossAreaSqft: ledgerData.units[0]?.grossAreaSqft || "—",
    netAreaSqft: ledgerData.units[0]?.netAreaSqft || "—",
    bookingNo: null,
    applicationFormNo: null,
    plan: null,
    status: ledgerData.units[0]?.relationType || "BOOKED",
  };

  const scheduleRows = ledgerData.scheduleRows || [];
  const overdueRows = scheduleRows.filter(
    (r) =>
      r.status?.toUpperCase() === "OVERDUE" ||
      (r.status?.toUpperCase() !== "PAID" && r.seq > 0),
  );

  // Default selection
  const defaultRow = initialInstallment || overdueRows[0] || scheduleRows[0] || null;

  const [selectedSeqOverride, setSelectedSeq] = React.useState<string | null>(null);
  const selectedSeq =
    selectedSeqOverride ??
    (initialInstallment
      ? String(initialInstallment.seq)
      : defaultRow
        ? String(defaultRow.seq)
        : "all");

  // Issuer name & designation state
  const [issuedByNameOverride, setIssuedByName] = React.useState<string | null>(null);
  const issuedByName = issuedByNameOverride ?? (currentUserName || "Management");
  const [designation, setDesignation] = React.useState<string>(
    "Recovery & Accounts Management",
  );
  const [customAmount, setCustomAmount] = React.useState<string>("");
  const [activeTab, setActiveTab] = React.useState<"preview" | "config">("preview");

  // Calculate current selected installment metrics
  const isAllOverdue = selectedSeq === "all";
  const selectedRow = scheduleRows.find((r) => String(r.seq) === selectedSeq);

  let pendingPkrNumber = 0;
  let installmentLabel = "Installment Payment";
  let milestoneWord = "installment";
  let dueDate: Date | string | null = null;
  let surchargePkr: string | null = null;

  if (isAllOverdue) {
    pendingPkrNumber = overdueRows.reduce((acc, r) => {
      const due = Number(r.amountPkr) || 0;
      const paid = Number(r.paidAmountPkr) || 0;
      return acc + Math.max(0, due - paid);
    }, 0);
    installmentLabel = `All Overdue Installments (${overdueRows.map((r) => r.label).join(", ") || "Outstanding"})`;
    milestoneWord = "overdue installments";
    dueDate = overdueRows[0]?.dueDate || null;
  } else if (selectedRow) {
    const due = Number(selectedRow.amountPkr) || 0;
    const paid = Number(selectedRow.paidAmountPkr) || 0;
    pendingPkrNumber = Math.max(0, due - paid);
    if (pendingPkrNumber === 0) pendingPkrNumber = due;
    installmentLabel = selectedRow.label;
    milestoneWord = resolveMilestoneWord(selectedRow.label, selectedRow.seq);
    dueDate = selectedRow.dueDate;
    surchargePkr = selectedRow.surchargePkr || null;
  }

  const finalPendingAmountStr =
    customAmount.trim() !== ""
      ? customAmount.trim()
      : pendingPkrNumber.toLocaleString("en-US");

  // Format unit area
  let areaDisplay = "—";
  if (unit.grossAreaSqft && unit.grossAreaSqft !== "—" && unit.grossAreaSqft !== "0") {
    const n = parseFloat(unit.grossAreaSqft);
    areaDisplay = isNaN(n) ? unit.grossAreaSqft : n.toLocaleString("en-US");
  } else if (unit.netAreaSqft && unit.netAreaSqft !== "—" && unit.netAreaSqft !== "0") {
    const n = parseFloat(unit.netAreaSqft);
    areaDisplay = isNaN(n) ? unit.netAreaSqft : n.toLocaleString("en-US");
  }

  // Client relations
  const clientTitle = client.title ? `${client.title} ` : "";
  const clientFullName = client.fullName;
  const relationPrefix = client.relationPrefix || "S/O";
  const relationPart = client.relationName
    ? `${relationPrefix} ${client.relationName}`
    : "";

  const salutationText = client.relationName
    ? `Dear ${clientTitle}${clientFullName} (${relationPart}),`
    : `Dear ${clientTitle}${clientFullName},`;

  const noticeDateStr = formatDate(new Date());
  const noticeRefNo = `SM/NOT-${unit.unitCode.replace(/[^a-zA-Z0-9]/g, "")}/${new Date().getFullYear()}`;

  function getPdfUrl(mode: "print" | "download") {
    const params = new URLSearchParams();
    if (unit.unitId) params.set("unitId", unit.unitId);
    if (selectedSeq) params.set("seq", selectedSeq);
    if (issuedByName) params.set("issuer", issuedByName);
    if (designation) params.set("designation", designation);
    if (customAmount.trim()) params.set("amount", customAmount.trim());
    if (mode === "print") {
      params.set("mode", "print");
    } else {
      params.set("mode", "download");
      params.set("download", "1");
    }
    return `/api/documents/client-ledger/${client.id}/notice/pdf?${params.toString()}`;
  }

  function handlePrint() {
    const url = getPdfUrl("print");
    window.open(url, "_blank");
  }

  function handleDownload() {
    const url = getPdfUrl("download");
    window.open(url, "_blank");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideCloseButton={true}
        className="flex max-h-[92vh] max-w-4xl flex-col overflow-hidden p-0"
      >
        {/* Dialog Header */}
        <DialogHeader className="border-b border-line bg-subtle/30 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-sold/10 text-sold">
                <Warning weight="bold" className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-[16px] font-semibold text-ink">
                  Issue Overdue Installment Reminder Notice
                </DialogTitle>
                <DialogDescription className="text-[12px] text-ink-muted">
                  Formal notice for unit {unit.unitCode} • Form #
                  {unit.applicationFormNo || unit.bookingNo || "—"}
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-md border border-line bg-surface p-0.5">
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className={cn(
                    "flex cursor-pointer items-center gap-1.5 rounded-[5px] px-2.5 py-1 text-[12px] font-medium transition-colors",
                    activeTab === "preview"
                      ? "bg-primary text-white shadow-xs"
                      : "text-ink-muted hover:text-ink",
                  )}
                >
                  <Eye weight="bold" className="size-3.5" />
                  <span>Preview Notice</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("config")}
                  className={cn(
                    "flex cursor-pointer items-center gap-1.5 rounded-[5px] px-2.5 py-1 text-[12px] font-medium transition-colors",
                    activeTab === "config"
                      ? "bg-primary text-white shadow-xs"
                      : "text-ink-muted hover:text-ink",
                  )}
                >
                  <SlidersHorizontal weight="bold" className="size-3.5" />
                  <span>Configure</span>
                </button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="size-8 p-0"
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Dialog Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "config" ? (
            /* Settings & Configuration Tab */
            <div className="space-y-5">
              <div className="rounded-[10px] border border-border bg-subtle/20 p-4">
                <h4 className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-ink">
                  <SlidersHorizontal weight="light" className="size-4 text-primary" />
                  <span>Installment &amp; Pending Amount Selection</span>
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-medium text-ink-muted uppercase">
                      Select Target Installment
                    </label>
                    <select
                      value={selectedSeq}
                      onChange={(e) => setSelectedSeq(e.target.value)}
                      className="h-9 w-full rounded-[8px] border border-line bg-surface px-3 text-[13px] text-ink focus:outline-primary"
                    >
                      {overdueRows.length > 1 && (
                        <option value="all">
                          ★ All Overdue Installments Combined ({overdueRows.length}{" "}
                          milestones)
                        </option>
                      )}
                      {scheduleRows.map((r) => (
                        <option key={r.seq} value={String(r.seq)}>
                          Seq {r.seq}: {r.label} — Due: {formatPkr(r.amountPkr)} (
                          {r.status?.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-medium text-ink-muted uppercase">
                      Custom Overdue Amount (PKR){" "}
                      <span className="text-ink-faint">(Optional Override)</span>
                    </label>
                    <input
                      type="text"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder={`Default: ${pendingPkrNumber.toLocaleString("en-US")}`}
                      className="h-9 w-full rounded-[8px] border border-line bg-surface px-3 text-[13px] text-ink placeholder:text-ink-faint focus:outline-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Issuing Authority Configuration */}
              <div className="rounded-[10px] border border-border bg-subtle/20 p-4">
                <h4 className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-ink">
                  <User weight="light" className="size-4 text-primary" />
                  <span>Issuing Officer &amp; Sign-off Details</span>
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-medium text-ink-muted uppercase">
                      Issued By (Officer Name)
                    </label>
                    <input
                      type="text"
                      value={issuedByName}
                      onChange={(e) => setIssuedByName(e.target.value)}
                      placeholder="e.g. Muhammad Farooq"
                      className="h-9 w-full rounded-[8px] border border-line bg-surface px-3 text-[13px] text-ink focus:outline-primary"
                    />
                    <p className="mt-1 text-[11px] text-ink-muted">
                      Pre-filled automatically with your logged-in session account name.
                    </p>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-medium text-ink-muted uppercase">
                      Officer Designation / Department
                    </label>
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="e.g. Recovery & Accounts Management"
                      className="h-9 w-full rounded-[8px] border border-line bg-surface px-3 text-[13px] text-ink focus:outline-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Summary of Data Extracted */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-[10px] border border-line bg-surface p-3.5">
                  <span className="mb-2 block text-[11px] font-semibold tracking-wider text-primary uppercase">
                    Client Details Picked
                  </span>
                  <div className="space-y-1 text-[12px]">
                    <div className="flex justify-between">
                      <span className="text-ink-muted">Name:</span>
                      <span className="font-semibold text-ink">
                        {clientTitle}
                        {clientFullName}
                      </span>
                    </div>
                    {client.relationName ? (
                      <div className="flex justify-between">
                        <span className="text-ink-muted">Relation:</span>
                        <span className="font-semibold text-ink">{relationPart}</span>
                      </div>
                    ) : null}
                    <div className="flex justify-between">
                      <span className="text-ink-muted">CNIC:</span>
                      <span className="font-sans text-ink">{client.cnic}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-muted">Phone:</span>
                      <span className="font-sans text-ink">{client.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-[10px] border border-line bg-surface p-3.5">
                  <span className="mb-2 block text-[11px] font-semibold tracking-wider text-primary uppercase">
                    Property Unit Picked
                  </span>
                  <div className="space-y-1 text-[12px]">
                    <div className="flex justify-between">
                      <span className="text-ink-muted">Unit Code:</span>
                      <span className="unit-code font-bold text-ink">
                        {unit.unitCode}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-muted">Floor:</span>
                      <span className="text-ink">{unit.floorName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-muted">Size:</span>
                      <span className="text-ink">{areaDisplay} sq. ft.</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-muted">Category:</span>
                      <span className="text-ink">
                        {unit.categoryName || "Office / Retail"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Document Live Paper Preview */
            <div className="mx-auto max-w-2xl rounded-[8px] border border-line bg-white p-8 font-sans text-[13px] leading-relaxed text-ink shadow-xs sm:p-10">
              {/* Document Header & Reference */}
              <div className="mb-5 flex items-center justify-between border-b border-primary pb-3">
                <div>
                  <h2 className="text-[16px] font-bold tracking-wide text-primary">
                    SARDAR&apos;S MALL
                  </h2>
                  <p className="text-[11px] text-ink-muted">
                    Commercial Complex • 54-C Iran Road, Block C, near Chandni Chowk,
                    Rawalpindi
                  </p>
                </div>
                <div className="text-right text-[11px]">
                  <span className="block font-semibold text-ink">Ref: {noticeRefNo}</span>
                  <span className="text-ink-muted">Date: {noticeDateStr}</span>
                </div>
              </div>

              {/* Recipient Credentials Box */}
              <div className="mb-5 rounded-[6px] border border-line/80 bg-subtle/20 p-3 text-[12px]">
                <span className="mb-1.5 block text-[10px] font-bold tracking-wider text-primary uppercase">
                  Client &amp; Allotment Credentials
                </span>
                <div className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
                  <div>
                    <span className="text-ink-muted">Client Name: </span>
                    <strong className="text-ink">
                      {clientTitle}
                      {clientFullName}
                    </strong>
                  </div>
                  {client.relationName ? (
                    <div>
                      <span className="text-ink-muted">Relation: </span>
                      <strong className="text-ink">{relationPart}</strong>
                    </div>
                  ) : null}
                  <div>
                    <span className="text-ink-muted">CNIC: </span>
                    <span className="font-medium text-ink">{client.cnic || "—"}</span>
                  </div>
                  <div>
                    <span className="text-ink-muted">Phone: </span>
                    <span className="font-medium text-ink">{client.phone || "—"}</span>
                  </div>
                  {client.homeAddress ? (
                    <div className="sm:col-span-2">
                      <span className="text-ink-muted">Address: </span>
                      <span className="text-ink">{client.homeAddress}</span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Title from Template */}
              <div className="mb-4 border-b border-line pb-2">
                <h1 className="text-[14px] font-bold tracking-wider text-ink uppercase">
                  NOTICE – INSTALLMENT PAYMENT REMINDER
                </h1>
              </div>

              {/* Salutation */}
              <p className="mb-3 font-bold text-ink">{salutationText}</p>

              {/* Opening Paragraph */}
              <p className="mb-3 text-ink">We hope you are doing well.</p>

              {/* Main Dynamic Paragraph */}
              <p className="mb-3 text-justify text-ink">
                With due respect, we would like to remind you of your pending{" "}
                <strong className="font-bold text-ink">{milestoneWord}</strong> of{" "}
                <strong className="font-bold text-sold">
                  PKR {finalPendingAmountStr}
                </strong>{" "}
                for <strong className="font-bold text-ink">{unit.floorName}</strong>,{" "}
                <strong className="font-bold text-ink">Unit No. {unit.unitCode}</strong>
                {areaDisplay !== "—" ? (
                  <>
                    , measuring{" "}
                    <strong className="font-bold text-ink">{areaDisplay} sq. ft.</strong>
                  </>
                ) : (
                  ""
                )}
                .
              </p>

              {/* Subtle Highlight Box for clarity */}
              <div className="my-3 flex flex-wrap items-center justify-between gap-3 rounded-[6px] border border-amber-300 bg-amber-50/60 px-3.5 py-2 text-[12px]">
                <div>
                  <span className="text-[10px] font-semibold text-amber-800 uppercase">
                    Installment
                  </span>
                  <span className="block font-semibold text-amber-950">
                    {installmentLabel}
                  </span>
                </div>
                {dueDate ? (
                  <div>
                    <span className="text-[10px] font-semibold text-amber-800 uppercase">
                      Due Date
                    </span>
                    <span className="block font-semibold text-amber-950">
                      {formatDate(dueDate)}
                    </span>
                  </div>
                ) : null}
                <div>
                  <span className="text-[10px] font-semibold text-amber-800 uppercase">
                    Pending Amount
                  </span>
                  <span className="block font-bold text-sold">
                    PKR {finalPendingAmountStr}
                  </span>
                </div>
                {surchargePkr && Number(surchargePkr) > 0 ? (
                  <div>
                    <span className="text-[10px] font-semibold text-amber-800 uppercase">
                      Surcharge
                    </span>
                    <span className="block font-semibold text-sold">
                      PKR {surchargePkr}
                    </span>
                  </div>
                ) : null}
              </div>

              {/* Template Body Paragraphs */}
              <p className="mb-3 text-justify text-ink">
                We humbly request you to kindly arrange payment of your outstanding
                installment at your earliest convenience. Your timely payments play a
                vital role in maintaining continuous construction activities and ensuring
                the smooth and timely progress of the project construction .
              </p>

              <p className="mb-3 text-justify text-ink">
                Our management and construction teams are making every possible effort to
                complete the project within the committed timeline and deliver your
                property as promised. Your cooperation and timely payments will greatly
                support us in continuing construction work without interruption and
                achieving our project delivery commitments.
              </p>

              <p className="mb-3 text-justify text-ink">
                We sincerely value your trust and confidence in our project. Your
                continued support and cooperation are highly appreciated.
              </p>

              <p className="mb-5 font-bold text-ink">
                Thank you for being a valued part of our project.
              </p>

              {/* Sign-off */}
              <div className="pt-2">
                <p className="mb-1 font-bold text-ink">Best Regards,</p>
                <p className="text-[14px] font-bold text-primary">
                  {issuedByName || "Management"}
                </p>
                <p className="text-[12px] text-ink-muted">{designation}</p>
                <p className="text-[12px] font-medium text-ink">Sardar&apos;s Mall</p>
              </div>
            </div>
          )}
        </div>

        {/* Dialog Footer Actions */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-line bg-subtle/30 px-6 py-3.5 sm:flex-row">
          <div className="flex items-center gap-2">
            <Pill tone="sold">Overdue Amount: PKR {finalPendingAmountStr}</Pill>
            <span className="text-[11px] text-ink-muted">
              Issued by: <strong className="text-ink">{issuedByName}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <Button
              variant="secondary"
              size="md"
              onClick={handlePrint}
              className="flex-1 gap-1.5 sm:flex-initial"
            >
              <Printer weight="light" className="size-4" />
              <span>Print Notice</span>
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleDownload}
              className="flex-1 gap-1.5 sm:flex-initial"
            >
              <DownloadSimple weight="light" className="size-4" />
              <span>Download PDF</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
