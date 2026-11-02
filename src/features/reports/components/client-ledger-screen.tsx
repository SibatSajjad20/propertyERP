"use client";

import * as React from "react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  DownloadSimple,
  Printer,
  MagnifyingGlass,
  User,
  UsersThree,
  Buildings,
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

export function ClientLedgerScreen({
  ledgerData,
  searchedClients,
  currentClientId,
}: ClientLedgerScreenProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPreset = (searchParams.get("preset") as ReportPreset) || "all";
  const [searchVal, setSearchVal] = React.useState(searchParams.get("q") || "");
  const [isExporting, setIsExporting] = React.useState(false);

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
    router.push(`/reports/client-ledger?${params.toString()}` as never);
  }

  function handlePresetChange(preset: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("preset", preset);
    router.push(`/reports/client-ledger?${params.toString()}` as never);
  }

  function handlePrint() {
    window.print();
  }

  function handleExportExcel() {
    if (!currentClientId) return;
    setIsExporting(true);
    const url = `/api/export/reports/client-ledger?${searchParams.toString()}`;
    window.open(url, "_blank");
    setTimeout(() => setIsExporting(false), 1000);
  }

  return (
    <div className="flex flex-col gap-6 p-4 select-none sm:p-6 print:p-0">
      {/* Printable Mall Header (Visible ONLY during Print) */}
      <div className="hidden print:mb-6 print:flex print:flex-col print:border-b-2 print:border-[#9A7B4F] print:pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block size-3 rounded-xs bg-[#9A7B4F]" />
            <h1 className="text-2xl font-bold text-[#0F172A]">Sardar&apos;s Mall ERP</h1>
          </div>
          <span className="font-mono text-xs text-[#64748B]">
            Statement Date: {new Date().toLocaleDateString("en-US")}
          </span>
        </div>
        <div className="mt-2 text-sm font-semibold text-[#0F172A]">
          Client Statement of Account
        </div>
        {ledgerData && (
          <div className="mt-1 text-xs text-[#64748B]">
            Client: {ledgerData.client.fullName} (CNIC: {ledgerData.client.cnic}) | Phone:{" "}
            {ledgerData.client.phone}
          </div>
        )}
      </div>

      {/* Screen Page Header */}
      <div className="space-y-4 print:hidden">
        <PageHeader
          title="Client Ledger &amp; Statement"
          description="Customer debtor statement with running balance, booking debits, payment receipts, and reversal credits."
          actions={
            ledgerData ? (
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="md" onClick={handlePrint}>
                  <Printer weight="light" className="size-4" />
                  <span>Print Statement</span>
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleExportExcel}
                  disabled={isExporting}
                >
                  <DownloadSimple weight="light" className="size-4" />
                  <span>{isExporting ? "Exporting..." : "Export Excel"}</span>
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
                    ? "border-primary font-semibold text-primary"
                    : "border-transparent text-ink-muted hover:border-line-strong hover:text-ink",
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Search client input (screen only) */}
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
                  className="flex cursor-pointer flex-col rounded-[8px] border border-line bg-subtle/40 p-2.5 text-left transition-colors hover:border-primary/50 hover:bg-subtle"
                >
                  <span className="text-[13px] font-medium text-ink">{c.fullName}</span>
                  <span className="font-mono text-[11px] text-ink-muted">{c.cnic}</span>
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
                  <p className="font-medium text-ink">{ledgerData.client.fullName}</p>
                </div>
                <div>
                  <span className="text-ink-muted">CNIC:</span>
                  <p className="font-mono text-[11px] font-medium text-ink">
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
                  <p className="text-ink">{ledgerData.client.email || "-"}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-ink-muted">Address:</span>
                  <p className="text-ink">{ledgerData.client.homeAddress}</p>
                </div>
              </div>
            </div>

            {/* Next of Kin Info */}
            <div className="card rounded-[12px] border-l-4 border-l-accent p-4">
              <div className="flex items-center gap-2">
                <UsersThree weight="light" className="size-4 text-accent" />
                <h4 className="text-[13px] font-semibold text-ink">
                  Next of Kin Details
                </h4>
              </div>
              {ledgerData.nextOfKin ? (
                <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
                  <div>
                    <span className="text-ink-muted">Name:</span>
                    <p className="font-medium text-ink">{ledgerData.nextOfKin.name}</p>
                  </div>
                  <div>
                    <span className="text-ink-muted">Relation:</span>
                    <p className="font-medium text-ink">
                      {ledgerData.nextOfKin.relation}
                    </p>
                  </div>
                  <div>
                    <span className="text-ink-muted">Phone:</span>
                    <p className="font-sans text-ink tabular-nums">
                      {ledgerData.nextOfKin.phone}
                    </p>
                  </div>
                  <div>
                    <span className="text-ink-muted">CNIC:</span>
                    <p className="font-mono text-[11px] text-ink">
                      {ledgerData.nextOfKin.cnic || "-"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-ink-muted">Address:</span>
                    <p className="text-ink">{ledgerData.nextOfKin.address || "-"}</p>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-[12px] text-ink-muted">
                  No next of kin recorded for this client.
                </p>
              )}
            </div>
          </div>

          {/* Associated Units */}
          <div className="card rounded-[12px] p-4">
            <div className="mb-3 flex items-center gap-2">
              <Buildings weight="light" className="size-4 text-primary" />
              <h4 className="text-[13px] font-semibold text-ink">
                Associated Units ({ledgerData.units.length})
              </h4>
            </div>
            {ledgerData.units.length === 0 ? (
              <p className="text-[12px] text-ink-muted">
                No unit contracts found for this client.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2.5">
                {ledgerData.units.map((u, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 rounded-[8px] border border-line bg-subtle/50 px-3 py-1.5"
                  >
                    <span className="font-mono text-[12px] font-semibold text-ink">
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
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Statement Balance Summary */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="card rounded-[12px] border-l-4 border-l-sold p-3.5">
              <span className="text-[11px] font-medium tracking-wider text-ink-muted uppercase">
                Unit Value
              </span>
              <p className="mt-1 font-sans text-[20px] font-semibold text-sold tabular-nums">
                {formatPkr(ledgerData.statement.totalDebitsPkr)}
              </p>
              <span className="text-[10px] text-ink-muted">
                Contracts &amp; amounts due
              </span>
            </div>

            <div className="card rounded-[12px] border-l-4 border-l-available p-3.5">
              <span className="text-[11px] font-medium tracking-wider text-ink-muted uppercase">
                Amount Received
              </span>
              <p className="mt-1 font-sans text-[20px] font-semibold text-available tabular-nums">
                {formatPkr(ledgerData.statement.totalCreditsPkr)}
              </p>
              <span className="text-[10px] text-ink-muted">
                Payments &amp; refund credits
              </span>
            </div>

            <div className="card rounded-[12px] border-l-4 border-l-primary p-3.5">
              <span className="text-[11px] font-medium tracking-wider text-ink-muted uppercase">
                Closing Balance
              </span>
              <p className="mt-1 font-sans text-[20px] font-semibold text-primary tabular-nums">
                {formatPkr(ledgerData.statement.closingBalancePkr)}
              </p>
              <span className="text-[10px] text-ink-muted">
                Current outstanding balance
              </span>
            </div>
          </div>

          {/* Running Ledger Statement Table */}
          <div className="card overflow-hidden rounded-[12px]">
            <div className="flex items-center justify-between border-b border-line bg-subtle/30 px-4 py-3">
              <div>
                <h4 className="text-[13px] font-semibold text-ink">
                  Running Financial Ledger
                </h4>
                <p className="text-[11px] text-ink-muted">
                  Chronological entries from {ledgerData.statement.period.startDate} to{" "}
                  {ledgerData.statement.period.endDate}
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-[12px]">
                <thead className="border-b border-line bg-subtle/60 text-[11px] font-medium tracking-wider text-ink-muted uppercase">
                  <tr>
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-3 py-2.5">Description</th>
                    <th className="px-3 py-2.5">Receipt #</th>
                    <th className="px-3 py-2.5 text-right">Debit (Amount Due)</th>
                    <th className="px-3 py-2.5 text-right">Credit (Payment)</th>
                    <th className="px-4 py-2.5 text-right">Running Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {/* Opening Balance Row */}
                  <tr className="bg-subtle/20 font-medium italic">
                    <td className="px-4 py-2.5 text-ink-muted tabular-nums">
                      {ledgerData.statement.period.startDate}
                    </td>
                    <td colSpan={4} className="px-3 py-2.5 text-ink-muted">
                      Opening Balance Brought Forward
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-ink tabular-nums">
                      {formatPkr(ledgerData.statement.openingBalancePkr)}
                    </td>
                  </tr>

                  {/* Transactions */}
                  {ledgerData.statement.entries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-ink-muted">
                        No transactions recorded in this period.
                      </td>
                    </tr>
                  ) : (
                    ledgerData.statement.entries.map((entry, idx) => (
                      <tr key={idx} className="transition-colors hover:bg-subtle/40">
                        <td className="px-4 py-2.5 text-ink tabular-nums">
                          {new Date(entry.date).toISOString().split("T")[0]}
                        </td>
                        <td className="px-3 py-2.5 font-medium text-ink">
                          {entry.description}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[11px] text-primary">
                          {entry.receiptNo || "-"}
                        </td>
                        <td className="px-3 py-2.5 text-right text-sold tabular-nums">
                          {entry.debitPkr !== "0.00" ? formatPkr(entry.debitPkr) : "-"}
                        </td>
                        <td className="px-3 py-2.5 text-right text-available tabular-nums">
                          {entry.creditPkr !== "0.00" ? formatPkr(entry.creditPkr) : "-"}
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold text-ink tabular-nums">
                          {formatPkr(entry.runningBalancePkr)}
                        </td>
                      </tr>
                    ))
                  )}

                  {/* Closing Balance Row */}
                  <tr className="border-t-2 border-line bg-subtle/30 font-bold">
                    <td className="px-4 py-2.5 text-ink tabular-nums">
                      {ledgerData.statement.period.endDate}
                    </td>
                    <td colSpan={2} className="px-3 py-2.5 text-ink">
                      Closing Balance Carried Forward
                    </td>
                    <td className="px-3 py-2.5 text-right text-sold tabular-nums">
                      {formatPkr(ledgerData.statement.totalDebitsPkr)}
                    </td>
                    <td className="px-3 py-2.5 text-right text-available tabular-nums">
                      {formatPkr(ledgerData.statement.totalCreditsPkr)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold text-primary tabular-nums">
                      {formatPkr(ledgerData.statement.closingBalancePkr)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
