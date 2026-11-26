"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { DotsThreeVertical, Printer } from "@phosphor-icons/react";
import { Pill } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatPkr, formatPkrCompact } from "@/lib/money";
import type { DetailedCollectionsReportData, DetailedCollectionTxRow } from "../queries";
import { ReportShell } from "./report-shell";

interface CollectionsReportScreenProps {
  data: DetailedCollectionsReportData;
  filterOptions: {
    blocks: Array<{ id: string; name: string }>;
    floors: Array<{ id: string; name: string; level: number }>;
    categories: Array<{ id: string; name: string }>;
  };
}

type CategoryTab =
  | "total"
  | "tokens"
  | "downPayments"
  | "installments"
  | "possessions"
  | "balloons"
  | "surcharges";

interface ExtendedTxRow extends DetailedCollectionTxRow {
  categoryLabel?: string;
}

function TxTable({
  rows,
  emptyLabel,
  showTokenStatus = false,
  showCategory = false,
}: {
  rows: ExtendedTxRow[];
  emptyLabel: string;
  showTokenStatus?: boolean;
  showCategory?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <div className="py-12 text-center text-[13px] text-ink-muted">{emptyLabel}</div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-[12px]">
        <thead className="h-[38px] border-b border-[var(--line)] bg-[#FAFBFC] text-[12px] font-medium text-[var(--ink-muted)] select-none">
          <tr>
            <th className="px-4 font-medium">Date</th>
            <th className="px-4 font-medium">Receipt #</th>
            <th className="px-4 font-medium">Customer</th>
            <th className="px-4 font-medium">Unit</th>
            {showCategory && <th className="px-4 font-medium">Category</th>}
            <th className="px-4 font-medium">Method</th>
            {showTokenStatus && <th className="px-4 font-medium">Adjustment</th>}
            <th className="px-4 text-right font-medium">Amount (PKR)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--line)]">
          {rows.map((r) => (
            <tr key={r.id} className="h-[44px] transition-colors hover:bg-[#F8FAFC]">
              <td className="px-4 py-2 text-ink tabular-nums">
                {new Date(r.date).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </td>
              <td className="px-4 py-2 font-sans text-[11px] font-semibold text-primary tabular-nums">
                {r.receiptNo || "—"}
              </td>
              <td className="px-4 py-2">
                <p className="font-medium text-ink">{r.clientName}</p>
                <p className="font-sans text-[10px] text-ink-muted tabular-nums">
                  {r.clientCnic} · {r.clientPhone}
                </p>
              </td>
              <td className="px-4 py-2">
                <span className="unit-code font-medium text-ink">{r.unitCode}</span>
                <p className="text-[11px] text-ink-muted">
                  {r.floorName} · {r.categoryName}
                </p>
              </td>
              {showCategory && (
                <td className="px-4 py-2">
                  <Pill tone="muted" className="text-[10px]">
                    {r.categoryLabel || "Collection"}
                  </Pill>
                </td>
              )}
              <td className="px-4 py-2 text-ink-muted capitalize">
                {r.method ? r.method.toLowerCase().replace("_", " ") : "—"}
              </td>
              {showTokenStatus && (
                <td className="px-4 py-2">
                  {r.adjustedToBooking ? (
                    <Pill tone="available">Adjusted to Booking</Pill>
                  ) : (
                    <Pill tone="accent">Held on Reservation</Pill>
                  )}
                </td>
              )}
              <td className="px-4 py-2 text-right font-semibold text-ink tabular-nums">
                {formatPkr(r.amountPkr)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CollectionsReportScreen({
  data,
  filterOptions,
}: CollectionsReportScreenProps) {
  const [activeTab, setActiveTab] = React.useState<CategoryTab>("total");
  const searchParams = useSearchParams();
  const s = data.summary;

  const allCollections = React.useMemo(() => {
    const list: ExtendedTxRow[] = [
      ...data.downPayments.map((r) => ({ ...r, categoryLabel: "Down Payment" })),
      ...data.tokens.map((r) => ({ ...r, categoryLabel: "Token" })),
      ...data.installments.map((r) => ({ ...r, categoryLabel: "Installment" })),
      ...data.possessions.map((r) => ({ ...r, categoryLabel: "Possession" })),
      ...data.balloons.map((r) => ({ ...r, categoryLabel: "Balloon" })),
    ];
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data]);

  const tabs: Array<{
    key: CategoryTab;
    label: string;
    total: string;
    count: number;
    tone: "available" | "accent" | "primary" | "neutral" | "sold";
    subtext: string;
  }> = [
    {
      key: "total",
      label: "Total Collected",
      total: s.grandTotalCollectedPkr,
      count: allCollections.length,
      tone: "available",
      subtext: `${allCollections.length} total receipts`,
    },
    {
      key: "tokens",
      label: "Token Amount",
      total: s.tokenTotalPkr,
      count: s.tokenCount,
      tone: "accent",
      subtext: `${s.tokenCount} token receipts`,
    },
    {
      key: "downPayments",
      label: "Down Payment",
      total: s.downPaymentTotalPkr,
      count: s.downPaymentCount,
      tone: "primary",
      subtext: `${s.downPaymentCount} record${s.downPaymentCount === 1 ? "" : "s"}`,
    },
    {
      key: "installments",
      label: "Installments",
      total: s.installmentsTotalPkr,
      count: s.installmentsCount,
      tone: "primary",
      subtext: `${s.installmentsCount} record${s.installmentsCount === 1 ? "" : "s"}`,
    },
    {
      key: "possessions",
      label: "Possession Payment",
      total: s.possessionTotalPkr,
      count: s.possessionCount,
      tone: "neutral",
      subtext: `${s.possessionCount} record${s.possessionCount === 1 ? "" : "s"}`,
    },
    {
      key: "balloons",
      label: "Balloon Payment",
      total: s.balloonTotalPkr,
      count: s.balloonCount,
      tone: "neutral",
      subtext: `${s.balloonCount} record${s.balloonCount === 1 ? "" : "s"}`,
    },
    {
      key: "surcharges",
      label: "Surcharges",
      total: s.surchargeOutstandingPkr,
      count: data.surcharges.length,
      tone: "sold",
      subtext: `${data.surcharges.length} overdue · waived ${formatPkrCompact(s.surchargeWaivedPkr)}`,
    },
  ];

  const activeTabMeta = tabs.find((t) => t.key === activeTab) || tabs[0];

  function handleOpenPdf() {
    const url = `/api/documents/reports/collections/pdf?${searchParams.toString()}`;
    window.open(url, "_blank");
  }

  return (
    <ReportShell
      title="Collections Management Report"
      description="Detailed collection breakdown across Token Amounts, Down Payments, Installments, Possession Payments, Annual Balloon Payments, and Surcharges."
      exportType="collections"
      stats={[]}
      filterConfig={{
        showFloors: true,
        showCategories: true,
        showSearch: true,
        searchPlaceholder: "Search customer, CNIC, unit, receipt…",
      }}
      filterOptions={filterOptions}
    >
      {/* Printable Mall Header (Visible ONLY during Print) */}
      <div className="hidden print:mb-6 print:flex print:flex-col print:border-b-2 print:border-[#0B558B] print:pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block size-3 rounded-xs bg-[#0B558B]" />
            <h1 className="text-2xl font-bold text-[#0F172A]">Sardar&apos;s Mall ERP</h1>
          </div>
          <span className="font-sans text-xs text-[#64748B] tabular-nums">
            Statement Date:{" "}
            {new Date().toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
        <div className="mt-2 text-sm font-semibold text-[#0F172A]">
          Collections Management Report — {activeTabMeta?.label}
        </div>
        <div className="mt-1 text-xs text-[#64748B]">
          Total Period Collections: {formatPkr(s.grandTotalCollectedPkr)} | Active
          Category: {activeTabMeta?.label} ({formatPkr(activeTabMeta?.total || "0")})
        </div>
      </div>

      <div className="space-y-4">
        {/* Interactive Category Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7 print:grid-cols-4 print:gap-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex cursor-pointer flex-col justify-between rounded-[10px] border p-3 text-left transition-all ${
                  isActive
                    ? "border-primary bg-primary/5 shadow-xs ring-2 ring-primary/30"
                    : "border-line bg-surface hover:border-line-strong hover:bg-subtle/40"
                }`}
              >
                <span className="text-[11px] font-medium tracking-wider text-ink-muted uppercase">
                  {tab.label}
                </span>
                <div className="mt-1.5">
                  <p className="font-sans text-[17px] font-semibold tracking-tight text-ink tabular-nums">
                    {formatPkrCompact(tab.total)}
                  </p>
                  <p className="mt-0.5 font-sans text-[10px] text-ink-muted tabular-nums">
                    {tab.subtext}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Category Detail Table Card */}
        <div className="overflow-hidden rounded-[12px] border border-[var(--line)] bg-[var(--surface)]">
          <div className="flex items-center justify-between border-b border-line bg-subtle/40 px-4 py-3">
            <div>
              <h3 className="text-[14px] font-semibold text-ink">
                {activeTabMeta?.label} Details
              </h3>
              <p className="text-[11px] text-ink-muted">
                {activeTab === "surcharges"
                  ? "0.05% per overdue day beyond 30-day grace period, net of waivers and collections."
                  : activeTab === "total"
                    ? "All recorded collection receipts across token, down payment, installment, and balloon categories."
                    : "Filtered transactions within selected reporting window."}
              </p>
            </div>

            {/* Three Dots Menu & Direct Actions */}
            <div className="flex items-center gap-2 print:hidden">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleOpenPdf}
                className="hidden gap-1.5 sm:inline-flex"
              >
                <Printer weight="light" className="size-4" />
                <span>Print / PDF</span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-8 w-8 p-0"
                    title="More options"
                  >
                    <DotsThreeVertical weight="bold" className="size-4" />
                    <span className="sr-only">More options</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={handleOpenPdf}
                    className="cursor-pointer gap-2"
                  >
                    <Printer weight="light" className="size-4 text-ink-muted" />
                    <span>Print / PDF</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="p-0">
            {activeTab === "total" && (
              <TxTable
                rows={allCollections}
                emptyLabel="No collections recorded in this period."
                showCategory={true}
              />
            )}
            {activeTab === "tokens" && (
              <TxTable
                rows={data.tokens}
                emptyLabel="No token deposits recorded."
                showTokenStatus={true}
              />
            )}
            {activeTab === "downPayments" && (
              <TxTable
                rows={data.downPayments}
                emptyLabel="No down payments recorded in this period."
              />
            )}
            {activeTab === "installments" && (
              <TxTable
                rows={data.installments}
                emptyLabel="No installment receipts recorded in this period."
              />
            )}
            {activeTab === "possessions" && (
              <TxTable
                rows={data.possessions}
                emptyLabel="No possession receipts recorded."
              />
            )}
            {activeTab === "balloons" && (
              <TxTable rows={data.balloons} emptyLabel="No balloon payments recorded." />
            )}
            {activeTab === "surcharges" && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-[12px]">
                  <thead className="h-[38px] border-b border-[var(--line)] bg-[#FAFBFC] text-[12px] font-medium text-[var(--ink-muted)] select-none">
                    <tr>
                      <th className="px-4 font-medium">Customer</th>
                      <th className="px-4 font-medium">Unit</th>
                      <th className="px-4 text-center font-medium">Inst #</th>
                      <th className="px-4 font-medium">Due Date</th>
                      <th className="px-4 text-right font-medium">Overdue Days</th>
                      <th className="px-4 text-right font-medium">Calculated</th>
                      <th className="px-4 text-right font-medium">Waived</th>
                      <th className="px-4 text-right font-medium">Net Surcharge</th>
                      <th className="px-4 text-center font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)]">
                    {data.surcharges.length === 0 ? (
                      <tr>
                        <td
                          colSpan={9}
                          className="py-12 text-center text-[13px] text-ink-muted"
                        >
                          No outstanding surcharges found for this period.
                        </td>
                      </tr>
                    ) : (
                      data.surcharges.map((s) => {
                        const isPaid = Number(s.paidPkr) > 0 && Number(s.netDuePkr) <= 0;
                        const isWaived = s.isExemptOrWaived;
                        return (
                          <tr
                            key={s.installmentId}
                            className="h-[44px] transition-colors hover:bg-[#F8FAFC]"
                          >
                            <td className="px-4 py-2">
                              <p className="font-medium text-ink">{s.clientName}</p>
                              <p className="font-sans text-[10px] text-ink-muted tabular-nums">
                                {s.clientCnic}
                              </p>
                            </td>
                            <td className="px-4 py-2">
                              <span className="unit-code font-medium text-ink">
                                {s.unitCode}
                              </span>
                              <p className="text-[11px] text-ink-muted">{s.floorName}</p>
                            </td>
                            <td className="px-4 py-2 text-center font-sans text-ink-muted tabular-nums">
                              {s.installmentLabel}
                            </td>
                            <td className="px-4 py-2 text-ink tabular-nums">
                              {new Date(s.dueDate).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </td>
                            <td className="px-4 py-2 text-right font-semibold text-sold tabular-nums">
                              {s.chargeableDays}d
                            </td>
                            <td className="px-4 py-2 text-right text-ink tabular-nums">
                              {formatPkr(s.rawAccruedPkr)}
                            </td>
                            <td className="px-4 py-2 text-right text-available tabular-nums">
                              {s.waivedPkr !== "0.00" ? formatPkr(s.waivedPkr) : "—"}
                            </td>
                            <td className="px-4 py-2 text-right font-bold text-sold tabular-nums">
                              {formatPkr(s.netDuePkr)}
                            </td>
                            <td className="px-4 py-2 text-center">
                              <Pill
                                tone={isPaid ? "available" : isWaived ? "muted" : "sold"}
                              >
                                {isPaid ? "Paid" : isWaived ? "Waived" : "Outstanding"}
                              </Pill>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </ReportShell>
  );
}
