"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DotsThreeVertical, DownloadSimple, Printer } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
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
        <thead className="border-b border-line bg-subtle/50 text-[11px] font-medium text-ink-muted">
          <tr>
            <th className="px-4 py-2.5">Date</th>
            <th className="px-4 py-2.5">Receipt #</th>
            <th className="px-4 py-2.5">Customer</th>
            <th className="px-4 py-2.5">Unit</th>
            {showCategory && <th className="px-4 py-2.5">Category</th>}
            <th className="px-4 py-2.5">Method</th>
            {showTokenStatus && <th className="px-4 py-2.5">Adjustment</th>}
            <th className="px-4 py-2.5 text-right">Amount (PKR)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line/60">
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-subtle/30">
              <td className="px-4 py-2.5 text-ink tabular-nums">
                {new Date(r.date).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </td>
              <td className="px-4 py-2.5 font-sans text-[11px] font-medium text-primary tabular-nums">
                {r.receiptNo || "—"}
              </td>
              <td className="px-4 py-2.5">
                <p className="font-medium text-ink">{r.clientName}</p>
                <p className="font-sans text-[10px] text-ink-muted tabular-nums">
                  {r.clientCnic} · {r.clientPhone}
                </p>
              </td>
              <td className="px-4 py-2.5">
                <span className="unit-code font-medium text-ink">{r.unitCode}</span>
                <p className="text-[11px] text-ink-muted">
                  {r.floorName} · {r.categoryName}
                </p>
              </td>
              {showCategory && (
                <td className="px-4 py-2.5">
                  <Badge tone="muted" className="text-[10px]">
                    {r.categoryLabel || "Collection"}
                  </Badge>
                </td>
              )}
              <td className="px-4 py-2.5 text-ink-muted">
                {r.method ? r.method.replace("_", " ") : "—"}
              </td>
              {showTokenStatus && (
                <td className="px-4 py-2.5">
                  {r.adjustedToBooking ? (
                    <Badge tone="available">Adjusted to Booking</Badge>
                  ) : (
                    <Badge tone="accent">Held on Reservation</Badge>
                  )}
                </td>
              )}
              <td className="px-4 py-2.5 text-right font-semibold text-ink tabular-nums">
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

  function handlePrint() {
    window.print();
  }

  function handleDownloadPdf() {
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
        {/* Interactive Category Cards (Single Clean Non-Duplicating Row) */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7 print:grid-cols-4 print:gap-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const borderTone =
              tab.tone === "available"
                ? "border-l-available"
                : tab.tone === "accent"
                  ? "border-l-primary"
                  : tab.tone === "primary"
                    ? "border-l-primary"
                    : tab.tone === "sold"
                      ? "border-l-sold"
                      : "border-l-line-strong";

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`card flex cursor-pointer flex-col justify-between rounded-[12px] border-l-4 p-3.5 text-left transition-all ${borderTone} ${
                  isActive
                    ? "border-primary bg-primary-soft/40 shadow-card ring-2 ring-primary ring-offset-1"
                    : "hover:-translate-y-0.5 hover:border-line-strong"
                }`}
              >
                <span className="text-[11px] font-medium tracking-wider text-ink-muted uppercase">
                  {tab.label}
                </span>
                <div className="mt-1.5">
                  <p className="font-sans text-[18px] font-semibold tracking-tight text-ink tabular-nums sm:text-[20px]">
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
        <div className="card overflow-hidden rounded-[12px]">
          <div className="flex items-center justify-between border-b border-line bg-subtle/40 px-4 py-3">
            <div>
              <h3 className="text-[14px] font-semibold text-ink">
                {activeTabMeta?.label} Details
              </h3>
              <p className="text-[11px] text-ink-muted">
                {activeTab === "surcharges"
                  ? "0.1% per overdue day beyond 30-day grace period, net of waivers and collections."
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
                onClick={handlePrint}
                className="hidden gap-1.5 sm:inline-flex"
              >
                <Printer weight="light" className="size-4" />
                <span>Print PDF</span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownloadPdf}
                className="hidden gap-1.5 sm:inline-flex"
              >
                <DownloadSimple weight="light" className="size-4" />
                <span>Download PDF</span>
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
                    onClick={handlePrint}
                    className="cursor-pointer gap-2"
                  >
                    <Printer weight="light" className="size-4 text-ink-muted" />
                    <span>Print PDF</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDownloadPdf}
                    className="cursor-pointer gap-2"
                  >
                    <DownloadSimple weight="light" className="size-4 text-ink-muted" />
                    <span>Download PDF</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {activeTab === "total" && (
            <TxTable
              rows={allCollections}
              emptyLabel="No collections recorded in this period."
              showCategory
            />
          )}
          {activeTab === "tokens" && (
            <TxTable
              rows={data.tokens}
              emptyLabel="No reservation token payments recorded in this period."
              showTokenStatus
            />
          )}
          {activeTab === "downPayments" && (
            <TxTable
              rows={data.downPayments}
              emptyLabel="No down payment transactions recorded in this period."
            />
          )}
          {activeTab === "installments" && (
            <TxTable
              rows={data.installments}
              emptyLabel="No installment collections recorded in this period."
            />
          )}
          {activeTab === "possessions" && (
            <TxTable
              rows={data.possessions}
              emptyLabel="No possession payments recorded in this period."
            />
          )}
          {activeTab === "balloons" && (
            <TxTable
              rows={data.balloons}
              emptyLabel="No annual balloon payments recorded in this period."
            />
          )}
          {activeTab === "surcharges" && (
            <div className="overflow-x-auto">
              {data.surcharges.length === 0 ? (
                <div className="py-12 text-center text-[13px] text-ink-muted">
                  No overdue surcharges accrued.
                </div>
              ) : (
                <table className="w-full border-collapse text-left text-[12px]">
                  <thead className="border-b border-line bg-subtle/50 text-[11px] font-medium text-ink-muted">
                    <tr>
                      <th className="px-4 py-2.5">Customer</th>
                      <th className="px-4 py-2.5">Unit / Booking</th>
                      <th className="px-4 py-2.5">Installment</th>
                      <th className="px-4 py-2.5 text-right">Days &gt; 30d</th>
                      <th className="px-4 py-2.5 text-right">Accrued</th>
                      <th className="px-4 py-2.5 text-right">Waived</th>
                      <th className="px-4 py-2.5 text-right">Paid</th>
                      <th className="px-4 py-2.5 text-right">Net Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60">
                    {data.surcharges.map((row) => (
                      <tr key={row.installmentId} className="hover:bg-subtle/30">
                        <td className="px-4 py-2.5">
                          <p className="font-medium text-ink">{row.clientName}</p>
                          <p className="font-sans text-[10px] text-ink-muted tabular-nums">
                            {row.clientCnic}
                          </p>
                        </td>
                        <td className="px-4 py-2.5">
                          <Link
                            href={`/bookings/${row.bookingId}` as never}
                            className="unit-code font-medium text-primary hover:underline"
                          >
                            {row.unitCode}
                          </Link>
                          <p className="text-[11px] text-ink-muted">{row.bookingNo}</p>
                        </td>
                        <td className="px-4 py-2.5">
                          <p className="text-ink">{row.installmentLabel}</p>
                          <p className="text-[10px] text-ink-muted tabular-nums">
                            Due{" "}
                            {new Date(row.dueDate).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums">
                          {row.chargeableDays}d
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums">
                          {formatPkr(row.rawAccruedPkr)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-ink-muted tabular-nums">
                          {formatPkr(row.waivedPkr)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-available tabular-nums">
                          {formatPkr(row.paidPkr)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold text-sold tabular-nums">
                          {row.isExemptOrWaived ? (
                            <Badge tone="muted">Waived</Badge>
                          ) : (
                            formatPkr(row.netDuePkr)
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </ReportShell>
  );
}
