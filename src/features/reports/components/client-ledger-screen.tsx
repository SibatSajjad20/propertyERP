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
} from "@phosphor-icons/react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { formatPkr } from "@/lib/money";
import { reportPresets, type ReportPreset } from "../schema";
import type { ClientLedgerReportData } from "../queries";

export interface ClientLedgerScreenProps {
  ledgerData: ClientLedgerReportData | null;
  searchedClients: Array<{ id: string; fullName: string; cnic: string; phone: string }>;
  currentClientId?: string;
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
}: ClientLedgerScreenProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPreset = (searchParams.get("preset") as ReportPreset) || "all";
  const [searchVal, setSearchVal] = React.useState(searchParams.get("q") || "");

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

  return (
    <div className="flex flex-col gap-6 p-4 select-none sm:p-6 print:p-0">
      {/* Screen Page Header */}
      <div className="space-y-4 print:hidden">
        <PageHeader
          title="Client Ledger &amp; Statement"
          description="Customer debtor statement with running balance, allotment details, and Schedule-B payment plan."
          actions={
            ledgerData ? (
              <div className="flex items-center gap-2">
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
                  className="flex cursor-pointer flex-col rounded-[8px] border border-line bg-subtle/40 p-2.5 text-left transition-colors hover:border-primary/40 hover:bg-primary-soft"
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
                      ? "bg-primary text-white"
                      : "bg-subtle text-ink-muted hover:bg-subtle/80 hover:text-ink",
                  )}
                >
                  {PRESET_LABELS[preset]}
                </button>
              );
            })}
          </div>

          {/* Client & Next of Kin Card */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Client Info */}
            <div className="card rounded-[12px] border-l-4 border-l-primary p-4">
              <div className="flex items-center gap-2">
                <User weight="light" className="size-4 text-primary" />
                <h4 className="text-[13px] font-semibold text-ink">Client Credentials</h4>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
                <div>
                  <span className="text-ink-muted">Full Name:</span>
                  <p className="font-medium text-ink">
                    {ledgerData.client.title ? `${ledgerData.client.title} ` : ""}
                    {ledgerData.client.fullName}
                  </p>
                </div>
                <div>
                  <span className="text-ink-muted">So/Do/Wo Name:</span>
                  <p className="font-medium text-ink">
                    {ledgerData.client.relationPrefix && ledgerData.client.relationName
                      ? `${ledgerData.client.relationPrefix} ${ledgerData.client.relationName}`
                      : ledgerData.client.relationName || "—"}
                  </p>
                </div>
                <div>
                  <span className="text-ink-muted">CNIC:</span>
                  <p className="font-sans text-[11px] font-medium text-ink tabular-nums">
                    {ledgerData.client.cnic}
                  </p>
                </div>
                <div>
                  <span className="text-ink-muted">Phone:</span>
                  <p className="font-sans text-ink tabular-nums">
                    {ledgerData.client.phone}
                  </p>
                </div>
                <div>
                  <span className="text-ink-muted">Email:</span>
                  <p className="text-ink">{ledgerData.client.email || "—"}</p>
                </div>
                <div>
                  <span className="text-ink-muted">Present Address:</span>
                  <p className="truncate text-ink">{ledgerData.client.homeAddress}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-ink-muted">Permanent Address:</span>
                  <p className="truncate text-ink">
                    {ledgerData.client.postalAddress || ledgerData.client.homeAddress}
                  </p>
                </div>
              </div>
            </div>

            {/* Next of Kin Info */}
            <div className="card rounded-[12px] border-l-4 border-l-primary p-4">
              <div className="flex items-center gap-2">
                <UsersThree weight="light" className="size-4 text-primary" />
                <h4 className="text-[13px] font-semibold text-ink">
                  Nominee / Next of Kin Details
                </h4>
              </div>
              {ledgerData.nextOfKin ? (
                <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
                  <div>
                    <span className="text-ink-muted">Nominee Name:</span>
                    <p className="font-medium text-ink">{ledgerData.nextOfKin.name}</p>
                  </div>
                  <div>
                    <span className="text-ink-muted">Relation:</span>
                    <p className="font-medium text-ink">
                      {ledgerData.nextOfKin.relation}
                    </p>
                  </div>
                  <div>
                    <span className="text-ink-muted">Nominee CNIC:</span>
                    <p className="font-sans text-[11px] text-ink tabular-nums">
                      {ledgerData.nextOfKin.cnic || "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-ink-muted">Phone:</span>
                    <p className="font-sans text-ink tabular-nums">
                      {ledgerData.nextOfKin.phone}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-ink-muted">Address:</span>
                    <p className="truncate text-ink">
                      {ledgerData.nextOfKin.address || "—"}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-[12px] text-ink-muted">
                  No nominee / next of kin recorded for this client.
                </p>
              )}
            </div>
          </div>

          {/* Associated Units Header / Switcher */}
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
                          : "border-line bg-subtle/50 hover:border-primary/40 hover:bg-subtle/80",
                      )}
                    >
                      <span className="unit-code text-[12px] font-semibold text-ink">
                        {u.unitCode}
                      </span>
                      <span className="text-[11px] text-ink-muted">{u.floorName}</span>
                      <span className="text-[11px] font-semibold text-ink tabular-nums">
                        {formatPkr(u.amountPkr)}
                      </span>
                      <Badge
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
                      </Badge>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* If Unit Selection is Mandatory and Not Yet Picked */}
          {ledgerData.requiresUnitSelection ? (
            <div className="card rounded-[12px] border-2 border-primary/40 bg-primary/5 p-6 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Buildings weight="light" className="size-6" />
              </div>
              <h3 className="mt-3 text-[16px] font-semibold text-ink">
                Unit Selection Required
              </h3>
              <p className="mx-auto mt-1 max-w-lg text-[13px] text-ink-muted">
                This client owns {ledgerData.units.length} booked / sold units. Please
                select a unit below to generate its official allotment ledger statement
                and Schedule-B payment plan.
              </p>
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {ledgerData.units.map((u) => (
                  <button
                    key={u.unitId}
                    type="button"
                    onClick={() => handleSelectUnit(u.unitId)}
                    className="group flex cursor-pointer flex-col rounded-[10px] border border-line bg-surface p-4 text-left transition-all hover:border-primary hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <span className="unit-code text-[14px] font-bold text-ink group-hover:text-primary">
                        {u.unitCode}
                      </span>
                      <Badge
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
                      </Badge>
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
          ) : (
            <>
              {/* File Details & Financial Details Side-by-Side (matching reference image) */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* File Details */}
                <div className="card overflow-hidden rounded-[12px]">
                  <div className="flex items-center gap-2 bg-[#1E293B] px-4 py-2.5 text-white">
                    <FileText weight="light" className="size-4 text-white" />
                    <h4 className="text-[13px] font-semibold tracking-wide uppercase">
                      File Details
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 gap-2 p-4 text-[12px]">
                    <div>
                      <span className="text-ink-muted">Project Name:</span>
                      <p className="font-semibold text-ink">Sardar&apos;s Mall</p>
                    </div>
                    <div>
                      <span className="text-ink-muted">Provisional Sector:</span>
                      <p className="font-semibold text-ink">Commercial</p>
                    </div>
                    <div>
                      <span className="text-ink-muted">Floor / Unit:</span>
                      <p className="font-semibold text-ink">
                        {selectedUnitDetails?.floorName} ({selectedUnitDetails?.unitCode})
                      </p>
                    </div>
                    <div>
                      <span className="text-ink-muted">Category:</span>
                      <p className="font-semibold text-ink">
                        {selectedUnitDetails?.categoryName || "Office / Retail"}
                      </p>
                    </div>
                    <div>
                      <span className="text-ink-muted">Size:</span>
                      <p className="font-semibold text-ink tabular-nums">
                        {selectedUnitDetails?.grossAreaSqft &&
                        selectedUnitDetails.grossAreaSqft !== "—"
                          ? `${selectedUnitDetails.grossAreaSqft} Sq Ft`
                          : selectedUnitDetails?.netAreaSqft &&
                              selectedUnitDetails.netAreaSqft !== "—"
                            ? `${selectedUnitDetails.netAreaSqft} Sq Ft`
                            : "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-ink-muted">Form No:</span>
                      <p className="font-semibold text-primary tabular-nums">
                        {selectedUnitDetails?.applicationFormNo ||
                          selectedUnitDetails?.bookingNo ||
                          "—"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Financial Details */}
                <div className="card overflow-hidden rounded-[12px]">
                  <div className="flex items-center gap-2 bg-[#1E293B] px-4 py-2.5 text-white">
                    <CurrencyDollar weight="light" className="size-4 text-white" />
                    <h4 className="text-[13px] font-semibold tracking-wide uppercase">
                      Financial Details
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 gap-2 p-4 text-[12px]">
                    <div>
                      <span className="text-ink-muted">Price:</span>
                      <p className="font-semibold text-ink tabular-nums">
                        {formatPkr(
                          financials?.listPrice || ledgerData.statement.totalDebitsPkr,
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="text-ink-muted">Discount:</span>
                      <p className="font-semibold text-ink tabular-nums">
                        {financials?.discountValue && Number(financials.discountValue) > 0
                          ? formatPkr(financials.discountValue)
                          : "Rs 0"}
                      </p>
                    </div>
                    <div>
                      <span className="text-ink-muted">Net Price:</span>
                      <p className="font-semibold text-ink tabular-nums">
                        {formatPkr(
                          financials?.netPrice || ledgerData.statement.totalDebitsPkr,
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="text-ink-muted">Paid Amount:</span>
                      <p className="font-semibold text-available tabular-nums">
                        {formatPkr(
                          financials?.paidTotal || ledgerData.statement.totalCreditsPkr,
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="text-ink-muted">Surcharge:</span>
                      <p
                        className={`font-semibold tabular-nums ${
                          financials?.surchargeAmount &&
                          Number(financials.surchargeAmount) > 0
                            ? "text-sold"
                            : "text-ink"
                        }`}
                      >
                        {formatPkr(financials?.surchargeAmount || "0.00")}
                      </p>
                    </div>
                    <div>
                      <span className="text-ink-muted">Govt Charges:</span>
                      <p className="font-semibold text-ink tabular-nums">
                        {formatPkr(financials?.govtCharges || "0.00")}
                      </p>
                    </div>
                    <div className="col-span-2 border-t border-line/60 pt-2">
                      <span className="text-ink-muted">Outstanding Balance:</span>
                      <p className="font-sans text-[18px] font-bold text-primary tabular-nums">
                        {formatPkr(
                          financials?.remainingAmount ||
                            ledgerData.statement.closingBalancePkr,
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statement Balance Summary */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="card rounded-[12px] border-l-4 border-l-sold p-3.5">
                  <span className="text-[11px] font-medium tracking-wider text-ink-muted uppercase">
                    Unit Value
                  </span>
                  <p className="mt-1 font-sans text-[20px] font-semibold text-sold tabular-nums">
                    {formatPkr(
                      financials?.netPrice || ledgerData.statement.totalDebitsPkr,
                    )}
                  </p>
                  <span className="text-[10px] text-ink-muted">
                    Contract value &amp; amounts due
                  </span>
                </div>

                <div className="card rounded-[12px] border-l-4 border-l-available p-3.5">
                  <span className="text-[11px] font-medium tracking-wider text-ink-muted uppercase">
                    Amount Received
                  </span>
                  <p className="mt-1 font-sans text-[20px] font-semibold text-available tabular-nums">
                    {formatPkr(
                      financials?.paidTotal || ledgerData.statement.totalCreditsPkr,
                    )}
                  </p>
                  <span className="text-[10px] text-ink-muted">
                    Payments received to date
                  </span>
                </div>

                <div className="card rounded-[12px] border-l-4 border-l-primary p-3.5">
                  <span className="text-[11px] font-medium tracking-wider text-ink-muted uppercase">
                    Outstanding Balance
                  </span>
                  <p className="mt-1 font-sans text-[20px] font-semibold text-primary tabular-nums">
                    {formatPkr(
                      financials?.remainingAmount ||
                        ledgerData.statement.closingBalancePkr,
                    )}
                  </p>
                  <span className="text-[10px] text-ink-muted">
                    Current outstanding amount
                  </span>
                </div>
              </div>

              {/* Schedule-B Payment Schedule Table */}
              <div className="card overflow-hidden rounded-[12px]">
                <div className="flex items-center justify-between border-b border-line bg-subtle/30 px-4 py-3">
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
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-sans text-[12px]">
                    <thead className="border-b border-line bg-subtle/60 text-[11px] font-medium tracking-wider text-ink-muted uppercase">
                      <tr>
                        <th className="w-12 px-3 py-2.5 text-center">Sr #</th>
                        <th className="px-4 py-2.5 whitespace-nowrap">
                          Payment Milestone / Installment
                        </th>
                        <th className="px-3 py-2.5 text-center">Due Date</th>
                        <th className="px-3 py-2.5 text-right">Due Amount</th>
                        <th className="px-3 py-2.5 text-center">Paid Date</th>
                        <th className="px-3 py-2.5 text-right">Paid Amount</th>
                        <th className="px-3 py-2.5 text-center">Receipt No</th>
                        <th className="px-3 py-2.5 text-right">Surcharge</th>
                        <th className="px-3 py-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line/60">
                      {scheduleRows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={9}
                            className="px-4 py-6 text-center text-ink-muted"
                          >
                            No installment schedule found for this unit.
                          </td>
                        </tr>
                      ) : (
                        scheduleRows.map((row) => {
                          const isPaid = row.status?.toUpperCase() === "PAID";
                          const isOverdue = row.status?.toUpperCase() === "OVERDUE";
                          const hasPaidAmt =
                            row.paidAmountPkr && Number(row.paidAmountPkr) > 0;
                          const paidAmtStr = hasPaidAmt
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
                                "transition-colors hover:bg-subtle/40",
                                row.seq === 0 && "bg-subtle/20 font-medium",
                              )}
                            >
                              <td className="px-3 py-2.5 text-center font-sans text-ink-muted tabular-nums">
                                {row.seq}
                              </td>
                              <td className="px-4 py-2.5 font-medium whitespace-nowrap text-ink">
                                {row.label === "Down Payment / Booking Amount"
                                  ? "Down Payment"
                                  : row.label}
                              </td>
                              <td className="px-3 py-2.5 text-center text-ink-muted tabular-nums">
                                {formatDate(row.dueDate)}
                              </td>
                              <td className="px-3 py-2.5 text-right font-semibold text-ink tabular-nums">
                                {formatPkr(row.amountPkr)}
                              </td>
                              <td className="px-3 py-2.5 text-center text-ink-muted tabular-nums">
                                {paidDateStr}
                              </td>
                              <td className="px-3 py-2.5 text-right font-medium text-available tabular-nums">
                                {paidAmtStr}
                              </td>
                              <td className="px-3 py-2.5 text-center font-sans text-[11px] text-primary tabular-nums">
                                {row.receiptNo || "—"}
                              </td>
                              <td className="px-3 py-2.5 text-right text-sold tabular-nums">
                                {surchargeStr}
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                <Badge
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
                                </Badge>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
