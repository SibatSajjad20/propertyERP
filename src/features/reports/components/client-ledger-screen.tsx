"use client";

import * as React from "react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Printer,
  DownloadSimple,
  MagnifyingGlass,
  User,
  UsersThree,
  Buildings,
  FileText,
  CurrencyDollar,
  ArrowRight,
  Warning,
} from "@phosphor-icons/react";
import { PageHeader } from "@/components/page-header";
import { Pill } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatStrip, StatCell } from "@/components/ui/stat-strip";
import { Panel } from "@/components/ui/panel";
import { DefinitionList, DefinitionRow } from "@/components/ui/definition-list";
import { cn } from "@/lib/cn";
import { formatPkr } from "@/lib/money";
import { reportPresets, type ReportPreset } from "../schema";
import type { ClientLedgerReportData, ClientLedgerScheduleRow } from "../queries";
import { OverdueNoticeDialog } from "./overdue-notice-dialog";

export interface ClientLedgerScreenProps {
  ledgerData: ClientLedgerReportData | null;
  searchedClients: Array<{ id: string; fullName: string; cnic: string; phone: string }>;
  currentClientId?: string;
  currentUserName?: string | null;
}

const PRESET_LABELS: Record<ReportPreset, string> = {
  this_month: "This Month",
  last_month: "Last Month",
  this_quarter: "This Quarter",
  this_year: "This Year",
  custom: "Custom",
  all: "All Time",
};

function formatDate(date: Date | string | null | undefined) {
  if (!date) return "—";
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return String(date);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function computeScheduleRowsWithBalance(
  scheduleRows: NonNullable<ClientLedgerReportData["scheduleRows"]>,
) {
  let totalDue = 0;
  let totalPaid = 0;
  let runningBal = 0;

  const rows = scheduleRows.map((row) => {
    const dueAmt = Number(row.amountPkr) || 0;
    const isPaid = row.status?.toUpperCase() === "PAID";
    const hasPaidAmt = row.paidAmountPkr && Number(row.paidAmountPkr) > 0;
    const paidAmt = hasPaidAmt ? Number(row.paidAmountPkr) : isPaid ? dueAmt : 0;

    totalDue += dueAmt;
    totalPaid += paidAmt;
    runningBal = Math.max(0, runningBal + (dueAmt - paidAmt));

    return {
      ...row,
      dueAmt,
      paidAmt,
      hasPaidAmt,
      isPaid,
      balanceDue: runningBal,
    };
  });

  return {
    rows,
    totalDue,
    totalPaid,
    totalBalanceDue: Math.max(0, totalDue - totalPaid),
  };
}

export function ClientLedgerScreen(props: ClientLedgerScreenProps) {
  return (
    <React.Suspense
      fallback={
        <div className="p-6 text-[13px] text-ink-muted">Loading client ledger…</div>
      }
    >
      <ClientLedgerScreenInner {...props} />
    </React.Suspense>
  );
}

function ClientLedgerScreenInner({
  ledgerData,
  searchedClients,
  currentClientId,
  currentUserName,
}: ClientLedgerScreenProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPreset = (searchParams.get("preset") as ReportPreset) || "all";
  const [searchVal, setSearchVal] = React.useState(searchParams.get("q") || "");
  const [noticeDialogOpen, setNoticeDialogOpen] = React.useState(false);
  const [selectedNoticeRow, setSelectedNoticeRow] =
    React.useState<ClientLedgerScheduleRow | null>(null);

  function handleOpenNotice(row: ClientLedgerScheduleRow | null) {
    setSelectedNoticeRow(row);
    setNoticeDialogOpen(true);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchVal.trim()) {
      params.set("q", searchVal.trim());
    } else {
      params.delete("q");
    }
    router.push(`/reports/client-ledger?${params.toString()}` as never);
  }

  function handleSelectClient(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("clientId", id);
    params.delete("unitId");
    router.push(`/reports/client-ledger?${params.toString()}` as never);
  }

  function handleSelectUnit(unitId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("unitId", unitId);
    router.push(`/reports/client-ledger?${params.toString()}` as never);
  }

  function handlePresetChange(preset: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("preset", preset);
    router.push(`/reports/client-ledger?${params.toString()}` as never);
  }

  function handlePrintPdf() {
    if (!currentClientId) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("mode", "print");
    const url = `/api/documents/client-ledger/${currentClientId}/pdf?${params.toString()}`;
    window.open(url, "_blank");
  }

  function handleDownloadPdf() {
    if (!currentClientId) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("mode", "download");
    params.set("download", "1");
    const url = `/api/documents/client-ledger/${currentClientId}/pdf?${params.toString()}`;
    window.open(url, "_blank");
  }

  const selectedUnitDetails = ledgerData?.selectedUnitDetails;
  const financials = ledgerData?.financials;
  const scheduleRows = ledgerData?.scheduleRows || [];
  const scheduleData = computeScheduleRowsWithBalance(scheduleRows);
  const rowsWithBalance = scheduleData.rows;
  const finalTotalDue = scheduleData.totalDue;
  const finalTotalPaid = scheduleData.totalPaid;
  const finalTotalBalanceDue = scheduleData.totalBalanceDue;

  const paidPercent =
    finalTotalDue > 0 ? Math.round((finalTotalPaid / finalTotalDue) * 100) : 0;

  const hasOverdueRows = scheduleRows.some(
    (r) =>
      r.status?.toUpperCase() === "OVERDUE" ||
      (r.status?.toUpperCase() !== "PAID" && r.seq > 0),
  );

  return (
    <div className="flex flex-col gap-6 select-none print:p-0">
      {/* Screen Page Header */}
      <div className="space-y-4 print:hidden">
        <PageHeader
          title="Client Ledger & Statement"
          description="Customer debtor statement with running balance, allotment details, and Schedule-B payment plan."
          actions={
            ledgerData ? (
              <div className="flex items-center gap-2">
                {hasOverdueRows && (
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => handleOpenNotice(null)}
                    className="gap-1.5 border-sold/30 text-sold hover:bg-sold/10 hover:text-sold"
                  >
                    <Warning weight="bold" className="size-4 text-sold" />
                    <span>Overdue Notice</span>
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="md"
                  onClick={handlePrintPdf}
                  className="gap-1.5"
                >
                  <Printer weight="light" className="size-4" />
                  <span>Print</span>
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleDownloadPdf}
                  className="gap-1.5"
                >
                  <DownloadSimple weight="light" className="size-4" />
                  <span>Download PDF</span>
                </Button>
              </div>
            ) : null
          }
        />

        {/* Reports Navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-line">
          {[
            { href: "/reports/summary" as Route, label: "Summary" },
            { href: "/reports/sold" as Route, label: "Sold" },
            { href: "/reports/booked" as Route, label: "Booked" },
            { href: "/reports/reserved" as Route, label: "Reserved" },
            { href: "/reports/installments" as Route, label: "Collections" },
            { href: "/reports/client-ledger" as Route, label: "Client ledger" },
          ].map((tab) => {
            const active =
              pathname === tab.href ||
              (tab.href === "/reports/summary" && pathname === "/reports");
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "-mb-px border-b-2 px-3.5 py-2 text-[13px] font-medium transition-colors",
                  active
                    ? "border-primary font-semibold text-ink"
                    : "border-transparent text-ink-muted hover:border-line-strong hover:text-ink",
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Search client input */}
      <div className="card rounded-[12px] p-4 print:hidden">
        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <MagnifyingGlass
              weight="light"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted"
            />
            <input
              type="text"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Search client by full name, CNIC (e.g. 12345-1234567-1), or phone number..."
              className="h-9 w-full rounded-[8px] border border-line bg-surface pr-4 pl-9 text-[13px] text-ink placeholder:text-ink-faint focus:outline-primary"
            />
          </div>
          <Button type="submit" variant="primary">
            Search Client
          </Button>
        </form>

        {/* Client Search Matches */}
        {searchedClients.length > 0 && !currentClientId && (
          <div className="mt-4 flex flex-col gap-1.5 border-t border-line/60 pt-3">
            <span className="text-[11px] font-medium tracking-wider text-ink-muted uppercase">
              Matching Clients ({searchedClients.length})
            </span>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {searchedClients.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelectClient(c.id)}
                  className="flex cursor-pointer flex-col rounded-[8px] border border-border bg-surface p-2.5 text-left transition-colors hover:border-primary/40 hover:bg-primary-soft"
                >
                  <span className="text-[13px] font-medium text-ink">{c.fullName}</span>
                  <span className="font-sans text-[11px] text-ink-muted tabular-nums">
                    {c.cnic}
                  </span>
                  <span className="font-sans text-[11px] text-ink-muted tabular-nums">
                    {c.phone}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* If No Client Selected */}
      {!ledgerData ? (
        <div className="card flex flex-col items-center justify-center rounded-[12px] p-12 text-center">
          <User weight="light" className="size-12 text-ink-muted opacity-50" />
          <h3 className="mt-3 text-[15px] font-semibold text-ink">Select a Client</h3>
          <p className="mt-1 max-w-md text-[13px] text-ink-muted">
            Search by client name, CNIC, or phone above to view their financial statement,
            all associated units, and running ledger.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Associated Units Header / Switcher (Positioned at TOP of count cards) */}
          <div className="card rounded-[12px] p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Buildings weight="light" className="size-4 text-primary" />
                <h4 className="text-[13px] font-semibold text-ink">
                  Associated Units ({ledgerData.units.length})
                </h4>
              </div>
              {ledgerData.units.length > 1 && (
                <span className="text-[11px] font-medium text-primary">
                  Click a unit below to switch schedule
                </span>
              )}
            </div>
            {ledgerData.units.length === 0 ? (
              <p className="text-[12px] text-ink-muted">
                No unit contracts found for this client.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2.5">
                {ledgerData.units.map((u) => {
                  const isSelected = u.unitId === ledgerData.selectedUnitId;
                  return (
                    <button
                      key={u.unitId}
                      type="button"
                      onClick={() => handleSelectUnit(u.unitId)}
                      className={cn(
                        "flex cursor-pointer items-center gap-2.5 rounded-[8px] border px-3 py-1.5 text-left transition-all",
                        isSelected
                          ? "border-primary bg-primary-soft shadow-xs ring-2 ring-primary/30"
                          : "border-border bg-surface text-ink hover:border-primary/40 hover:bg-[#F1F3F6]",
                      )}
                    >
                      <span className="unit-code text-[12px] font-semibold text-ink">
                        {u.unitCode}
                      </span>
                      <span className="text-[11px] text-ink-muted">{u.floorName}</span>
                      <span className="text-[11px] font-semibold text-ink tabular-nums">
                        {formatPkr(u.amountPkr)}
                      </span>
                      <Pill
                        tone={
                          u.relationType === "SOLD"
                            ? "sold"
                            : u.relationType === "BOOKED"
                              ? "primary"
                              : u.relationType === "RESERVED"
                                ? "accent"
                                : "muted"
                        }
                      >
                        {u.relationType}
                      </Pill>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* If Unit Selection is Mandatory and Not Yet Picked */}
          {ledgerData.requiresUnitSelection ? (
            <>
              <div className="card rounded-[12px] border-2 border-primary/40 bg-primary/5 p-6 text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Buildings weight="light" className="size-6" />
                </div>
                <h3 className="mt-3 text-[16px] font-semibold text-ink">
                  Unit Selection Required
                </h3>
                <p className="mx-auto mt-1 max-w-lg text-[13px] text-ink-muted">
                  This client owns {ledgerData.units.length} booked / sold units. Please
                  select an associated unit above to generate its official allotment
                  ledger statement, financial summary, and Schedule-B payment plan.
                </p>
                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {ledgerData.units.map((u) => (
                    <button
                      key={u.unitId}
                      type="button"
                      onClick={() => handleSelectUnit(u.unitId)}
                      className="group flex cursor-pointer flex-col rounded-[10px] border border-border bg-surface p-4 text-left transition-all hover:border-primary hover:shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <span className="unit-code text-[14px] font-bold text-ink group-hover:text-primary">
                          {u.unitCode}
                        </span>
                        <Pill
                          tone={
                            u.relationType === "SOLD"
                              ? "sold"
                              : u.relationType === "BOOKED"
                                ? "primary"
                                : u.relationType === "RESERVED"
                                  ? "accent"
                                  : "muted"
                          }
                        >
                          {u.relationType}
                        </Pill>
                      </div>
                      <span className="mt-1 text-[12px] text-ink-muted">
                        {u.floorName} {u.categoryName ? `• ${u.categoryName}` : ""}
                      </span>
                      <span className="mt-2 text-[14px] font-semibold text-ink tabular-nums">
                        {formatPkr(u.amountPkr)}
                      </span>
                      <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-primary group-hover:underline">
                        <span>Select Unit &amp; View Schedule</span>
                        <ArrowRight weight="bold" className="size-3" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Client & Next of Kin Panels (Visible when unit is pending selection) */}
              <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
                <Panel title="Client Credentials" hint="Registered primary buyer">
                  <DefinitionList>
                    <DefinitionRow
                      label="Full Name"
                      value={`${ledgerData.client.title ? `${ledgerData.client.title} ` : ""}${ledgerData.client.fullName}`}
                    />
                    <DefinitionRow
                      label="Relation Name"
                      value={
                        ledgerData.client.relationPrefix && ledgerData.client.relationName
                          ? `${ledgerData.client.relationPrefix} ${ledgerData.client.relationName}`
                          : ledgerData.client.relationName || "—"
                      }
                    />
                    <DefinitionRow label="CNIC" value={ledgerData.client.cnic} />
                    <DefinitionRow label="Phone" value={ledgerData.client.phone} />
                    <DefinitionRow label="Email" value={ledgerData.client.email || "—"} />
                    <DefinitionRow
                      label="Present Address"
                      value={ledgerData.client.homeAddress}
                    />
                    <DefinitionRow
                      label="Permanent Address"
                      value={
                        ledgerData.client.postalAddress || ledgerData.client.homeAddress
                      }
                    />
                  </DefinitionList>
                </Panel>

                <Panel
                  title="Nominee / Next of Kin Details"
                  hint="Legal successor nominee"
                >
                  {ledgerData.nextOfKin ? (
                    <DefinitionList>
                      <DefinitionRow
                        label="Nominee Name"
                        value={ledgerData.nextOfKin.name}
                      />
                      <DefinitionRow
                        label="Relation"
                        value={ledgerData.nextOfKin.relation}
                      />
                      <DefinitionRow
                        label="Nominee CNIC"
                        value={ledgerData.nextOfKin.cnic || "—"}
                      />
                      <DefinitionRow label="Phone" value={ledgerData.nextOfKin.phone} />
                      <DefinitionRow
                        label="Address"
                        value={ledgerData.nextOfKin.address || "—"}
                      />
                    </DefinitionList>
                  ) : (
                    <p className="text-[12px] text-ink-muted">
                      No nominee / next of kin recorded for this client.
                    </p>
                  )}
                </Panel>
              </div>
            </>
          ) : (
            <>
              {/* 4-Cell StatStrip (Count Cards shown once unit is selected) */}
              <StatStrip columns={4}>
                <StatCell
                  label="Total Contract Due"
                  value={formatPkr(finalTotalDue.toFixed(0))}
                  subLine="total scheduled contract amount"
                />
                <StatCell
                  label="Total Paid"
                  value={formatPkr(finalTotalPaid.toFixed(0))}
                  subLine={`${paidPercent}% settled`}
                  progress={paidPercent}
                  valueClassName="text-available"
                />
                <StatCell
                  label="Remaining Balance"
                  value={formatPkr(finalTotalBalanceDue.toFixed(0))}
                  subLine="outstanding receivable"
                  valueClassName="text-primary"
                />
                <StatCell
                  label="Surcharge / Overdue"
                  value={formatPkr(financials?.surchargeAmount || "0.00")}
                  subLine="penalty / late surcharge"
                  valueClassName={
                    financials?.surchargeAmount && Number(financials.surchargeAmount) > 0
                      ? "text-sold"
                      : undefined
                  }
                />
              </StatStrip>

              {/* Client & Next of Kin Panels */}
              <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
                <Panel title="Client Credentials" hint="Registered primary buyer">
                  <DefinitionList>
                    <DefinitionRow
                      label="Full Name"
                      value={`${ledgerData.client.title ? `${ledgerData.client.title} ` : ""}${ledgerData.client.fullName}`}
                    />
                    <DefinitionRow
                      label="Relation Name"
                      value={
                        ledgerData.client.relationPrefix && ledgerData.client.relationName
                          ? `${ledgerData.client.relationPrefix} ${ledgerData.client.relationName}`
                          : ledgerData.client.relationName || "—"
                      }
                    />
                    <DefinitionRow label="CNIC" value={ledgerData.client.cnic} />
                    <DefinitionRow label="Phone" value={ledgerData.client.phone} />
                    <DefinitionRow label="Email" value={ledgerData.client.email || "—"} />
                    <DefinitionRow
                      label="Present Address"
                      value={ledgerData.client.homeAddress}
                    />
                    <DefinitionRow
                      label="Permanent Address"
                      value={
                        ledgerData.client.postalAddress || ledgerData.client.homeAddress
                      }
                    />
                  </DefinitionList>
                </Panel>

                <Panel
                  title="Nominee / Next of Kin Details"
                  hint="Legal successor nominee"
                >
                  {ledgerData.nextOfKin ? (
                    <DefinitionList>
                      <DefinitionRow
                        label="Nominee Name"
                        value={ledgerData.nextOfKin.name}
                      />
                      <DefinitionRow
                        label="Relation"
                        value={ledgerData.nextOfKin.relation}
                      />
                      <DefinitionRow
                        label="Nominee CNIC"
                        value={ledgerData.nextOfKin.cnic || "—"}
                      />
                      <DefinitionRow label="Phone" value={ledgerData.nextOfKin.phone} />
                      <DefinitionRow
                        label="Address"
                        value={ledgerData.nextOfKin.address || "—"}
                      />
                    </DefinitionList>
                  ) : (
                    <p className="text-[12px] text-ink-muted">
                      No nominee / next of kin recorded for this client.
                    </p>
                  )}
                </Panel>
              </div>

              {/* Period Presets Filter (screen only) */}
              <div className="flex items-center gap-2 print:hidden">
                <span className="text-[12px] font-medium text-ink-muted">
                  Statement Period:
                </span>
                {reportPresets.map((preset) => {
                  const active = currentPreset === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handlePresetChange(preset)}
                      className={cn(
                        "cursor-pointer rounded-[6px] px-2.5 py-1 text-[12px] font-medium transition-colors",
                        active
                          ? "bg-primary text-white shadow-xs"
                          : "border border-border bg-surface text-ink-muted hover:border-line-strong hover:bg-[#F1F3F6] hover:text-ink",
                      )}
                    >
                      {PRESET_LABELS[preset]}
                    </button>
                  );
                })}
              </div>

              {/* File Details & Financial Details Side-by-Side */}
              <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
                <Panel title="File Details" hint="Property allotment specifications">
                  <DefinitionList>
                    <DefinitionRow label="Project Name" value="Sardar's Mall" />
                    <DefinitionRow label="Provisional Sector" value="Commercial" />
                    <DefinitionRow
                      label="Floor / Unit"
                      value={`${selectedUnitDetails?.floorName} (${selectedUnitDetails?.unitCode})`}
                    />
                    <DefinitionRow
                      label="Category"
                      value={selectedUnitDetails?.categoryName || "Office / Retail"}
                    />
                    <DefinitionRow
                      label="Size"
                      value={
                        selectedUnitDetails?.grossAreaSqft &&
                        selectedUnitDetails.grossAreaSqft !== "—"
                          ? `${selectedUnitDetails.grossAreaSqft} Sq Ft`
                          : selectedUnitDetails?.netAreaSqft &&
                              selectedUnitDetails.netAreaSqft !== "—"
                            ? `${selectedUnitDetails.netAreaSqft} Sq Ft`
                            : "—"
                      }
                    />
                    <DefinitionRow
                      label="Form No"
                      value={
                        <span className="font-semibold text-primary">
                          {selectedUnitDetails?.applicationFormNo ||
                            selectedUnitDetails?.bookingNo ||
                            "—"}
                        </span>
                      }
                    />
                  </DefinitionList>
                </Panel>

                <Panel title="Financial Details" hint="Price, discount, and receipts">
                  <DefinitionList>
                    <DefinitionRow
                      label="Price"
                      value={formatPkr(
                        financials?.listPrice || ledgerData.statement.totalDebitsPkr,
                      )}
                    />
                    <DefinitionRow
                      label="Discount"
                      value={
                        financials?.discountValue && Number(financials.discountValue) > 0
                          ? formatPkr(financials.discountValue)
                          : "Rs 0"
                      }
                    />
                    <DefinitionRow
                      label="Net Price"
                      value={formatPkr(
                        financials?.netPrice || ledgerData.statement.totalDebitsPkr,
                      )}
                    />
                    <DefinitionRow
                      label="Paid Amount"
                      value={
                        <span className="font-semibold text-available">
                          {formatPkr(
                            financials?.paidTotal || ledgerData.statement.totalCreditsPkr,
                          )}
                        </span>
                      }
                    />
                    <DefinitionRow
                      label="Surcharge"
                      value={
                        <span
                          className={
                            financials?.surchargeAmount &&
                            Number(financials.surchargeAmount) > 0
                              ? "font-semibold text-sold"
                              : ""
                          }
                        >
                          {formatPkr(financials?.surchargeAmount || "0.00")}
                        </span>
                      }
                    />
                    <DefinitionRow
                      label="Govt Charges"
                      value={formatPkr(financials?.govtCharges || "0.00")}
                    />
                    <DefinitionRow
                      label="Outstanding Balance"
                      value={
                        <span className="font-sans text-[16px] font-bold text-primary">
                          {formatPkr(
                            financials?.remainingAmount ||
                              ledgerData.statement.closingBalancePkr,
                          )}
                        </span>
                      }
                    />
                  </DefinitionList>
                </Panel>
              </div>

              {/* Schedule-B Payment Schedule Table */}
              <div className="overflow-hidden rounded-[12px] border border-[var(--line)] bg-[var(--surface)]">
                <div className="flex flex-col items-start justify-between gap-3 border-b border-line bg-subtle/30 px-4 py-3 sm:flex-row sm:items-center">
                  <div>
                    <h4 className="text-[13px] font-semibold text-ink">
                      Installment Details (Payment Schedule - Schedule B)
                    </h4>
                    <p className="text-[11px] text-ink-muted">
                      Official payment schedule for unit{" "}
                      {selectedUnitDetails?.unitCode || "contract"} • Form #
                      {selectedUnitDetails?.applicationFormNo ||
                        selectedUnitDetails?.bookingNo ||
                        "—"}
                    </p>
                  </div>
                  {/* Total Due Card on top of Table */}
                  <div className="flex items-center gap-3 self-stretch rounded-[8px] border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-right sm:self-auto">
                    <div>
                      <span className="block text-[10px] font-semibold tracking-wider text-primary uppercase">
                        Total Due Amount
                      </span>
                      <span className="font-sans text-[15px] font-bold text-ink tabular-nums">
                        {formatPkr(finalTotalDue.toFixed(2))}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-sans text-[12px]">
                    <thead className="h-[38px] border-b border-[var(--line)] bg-[#FAFBFC] text-[12px] font-medium text-[var(--ink-muted)] select-none">
                      <tr>
                        <th className="w-12 px-3 text-center font-medium">Sr #</th>
                        <th className="px-4 font-medium whitespace-nowrap">
                          Payment Milestone
                        </th>
                        <th className="px-3 text-center font-medium">Due Date</th>
                        <th className="px-3 text-right font-medium">Due Amount</th>
                        <th className="px-3 text-center font-medium">Paid Date</th>
                        <th className="px-3 text-right font-medium">Paid Amount</th>
                        <th className="px-3 text-right font-medium">Balance Due</th>
                        <th className="px-3 text-center font-medium">Receipt No</th>
                        <th className="px-3 text-right font-medium">Surcharge</th>
                        <th className="px-3 text-center font-medium">Status</th>
                        <th className="px-3 text-center font-medium">Notice</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--line)]">
                      {rowsWithBalance.length === 0 ? (
                        <tr>
                          <td
                            colSpan={11}
                            className="px-4 py-6 text-center text-ink-muted"
                          >
                            No installment schedule found for this unit.
                          </td>
                        </tr>
                      ) : (
                        rowsWithBalance.map((row) => {
                          const isPaid = row.isPaid;
                          const isOverdue = row.status?.toUpperCase() === "OVERDUE";
                          const paidAmtStr = row.hasPaidAmt
                            ? formatPkr(row.paidAmountPkr!)
                            : isPaid
                              ? formatPkr(row.amountPkr)
                              : "—";
                          const paidDateStr = row.paidDate
                            ? formatDate(row.paidDate)
                            : "—";
                          const hasSurcharge =
                            row.surchargePkr &&
                            row.surchargePkr !== "—" &&
                            Number(row.surchargePkr) > 0;
                          const surchargeStr = hasSurcharge
                            ? formatPkr(row.surchargePkr!)
                            : "—";

                          return (
                            <tr
                              key={row.seq}
                              className={cn(
                                "h-[44px] transition-colors hover:bg-[#F8FAFC]",
                                row.seq === 0 && "bg-subtle/20 font-medium",
                              )}
                            >
                              <td className="px-3 py-2 text-center font-sans text-ink-muted tabular-nums">
                                {row.seq}
                              </td>
                              <td className="px-4 py-2 font-medium whitespace-nowrap text-ink">
                                {row.label === "Down Payment / Booking Amount"
                                  ? "Down Payment"
                                  : row.label}
                              </td>
                              <td className="px-3 py-2 text-center text-ink-muted tabular-nums">
                                {formatDate(row.dueDate)}
                              </td>
                              <td className="px-3 py-2 text-right font-semibold text-ink tabular-nums">
                                {formatPkr(row.amountPkr)}
                              </td>
                              <td className="px-3 py-2 text-center text-ink-muted tabular-nums">
                                {paidDateStr}
                              </td>
                              <td className="px-3 py-2 text-right font-medium text-available tabular-nums">
                                {paidAmtStr}
                              </td>
                              <td className="px-3 py-2 text-right font-semibold text-primary tabular-nums">
                                {formatPkr(row.balanceDue.toFixed(2))}
                              </td>
                              <td className="px-3 py-2 text-center font-sans text-[11px] whitespace-nowrap text-primary tabular-nums">
                                {row.receiptNo || "—"}
                              </td>
                              <td className="px-3 py-2 text-right text-sold tabular-nums">
                                {surchargeStr}
                              </td>
                              <td className="px-3 py-2 text-center">
                                <Pill
                                  tone={
                                    isPaid
                                      ? "available"
                                      : isOverdue
                                        ? "sold"
                                        : row.status === "PARTIAL"
                                          ? "primary"
                                          : "muted"
                                  }
                                >
                                  {row.status?.toUpperCase() || "PENDING"}
                                </Pill>
                              </td>
                              <td className="px-3 py-2 text-center">
                                {isOverdue || (!isPaid && row.seq > 0) ? (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenNotice(row)}
                                    title="Issue Overdue Installment Payment Reminder Notice"
                                    className="inline-flex cursor-pointer items-center gap-1 rounded-[5px] border border-sold/30 bg-sold/5 px-2 py-0.5 text-[11px] font-medium text-sold transition-colors hover:bg-sold hover:text-white"
                                  >
                                    <Warning weight="bold" className="size-3" />
                                    <span>Notice</span>
                                  </button>
                                ) : (
                                  <span className="text-[11px] text-ink-muted">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    <tfoot className="h-[44px] border-t-2 border-[var(--line)] bg-[#FAFBFC] font-semibold text-ink">
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-2 text-right font-bold tracking-wider text-ink uppercase"
                        >
                          Total
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-ink tabular-nums">
                          {formatPkr(finalTotalDue.toFixed(2))}
                        </td>
                        <td className="px-3 py-2 text-center text-ink-muted">—</td>
                        <td className="px-3 py-2 text-right font-bold text-available tabular-nums">
                          {formatPkr(finalTotalPaid.toFixed(2))}
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-primary tabular-nums">
                          {formatPkr(finalTotalBalanceDue.toFixed(2))}
                        </td>
                        <td className="px-3 py-2 text-center text-ink-muted">—</td>
                        <td className="px-3 py-2 text-right text-ink-muted">—</td>
                        <td className="px-3 py-2 text-center text-ink-muted">—</td>
                        <td className="px-3 py-2 text-center text-ink-muted">—</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Page Footer */}
              <div className="mt-2 flex flex-col items-center justify-between gap-2 border-t border-line pt-4 text-[12px] text-ink-muted sm:flex-row print:flex">
                <span>
                  Sardar&apos;s Mall • 54-C Iran Road, Block C, near Chandni Chowk,
                  Rawalpindi
                </span>
                <span>Official Statement of Account • Page 1</span>
              </div>
            </>
          )}
        </div>
      )}

      {ledgerData && (
        <OverdueNoticeDialog
          open={noticeDialogOpen}
          onOpenChange={setNoticeDialogOpen}
          ledgerData={ledgerData}
          initialInstallment={selectedNoticeRow}
          currentUserName={currentUserName}
        />
      )}
    </div>
  );
}
