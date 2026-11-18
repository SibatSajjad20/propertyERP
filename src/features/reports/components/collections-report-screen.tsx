"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatPkr, formatPkrCompact, parseDecimal } from "@/lib/money";
import type { DetailedCollectionsReportData, DetailedCollectionTxRow } from "../queries";
import { ReportShell, type ReportStatCard } from "./report-shell";

interface CollectionsReportScreenProps {
  data: DetailedCollectionsReportData;
  filterOptions: {
    blocks: Array<{ id: string; name: string }>;
    floors: Array<{ id: string; name: string; level: number }>;
    categories: Array<{ id: string; name: string }>;
  };
}

type CategoryTab =
  "tokens" | "downPayments" | "installments" | "possessions" | "balloons" | "surcharges";

function TxTable({
  rows,
  emptyLabel,
  showTokenStatus = false,
}: {
  rows: DetailedCollectionTxRow[];
  emptyLabel: string;
  showTokenStatus?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <div className="py-10 text-center text-[13px] text-ink-muted">{emptyLabel}</div>
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
              <td className="px-4 py-2.5 font-mono text-[11px] font-medium text-primary">
                {r.receiptNo || "—"}
              </td>
              <td className="px-4 py-2.5">
                <p className="font-medium text-ink">{r.clientName}</p>
                <p className="font-mono text-[10px] text-ink-muted">
                  {r.clientCnic} · {r.clientPhone}
                </p>
              </td>
              <td className="px-4 py-2.5">
                <span className="unit-code font-mono font-medium text-ink">
                  {r.unitCode}
                </span>
                <p className="text-[11px] text-ink-muted">
                  {r.floorName} · {r.categoryName}
                </p>
              </td>
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
  const [activeTab, setActiveTab] = React.useState<CategoryTab>("tokens");
  const s = data.summary;

  const stats: ReportStatCard[] = [
    {
      label: "Total Collected",
      value: formatPkrCompact(s.grandTotalCollectedPkr),
      subValue: formatPkr(s.grandTotalCollectedPkr),
      tone: "available",
    },
    {
      label: "Token Amount",
      value: formatPkrCompact(s.tokenTotalPkr),
      subValue: `${s.tokenCount} tokens`,
      tone: "accent",
    },
    {
      label: "Down Payments",
      value: formatPkrCompact(s.downPaymentTotalPkr),
      subValue: `${s.downPaymentCount} receipts`,
      tone: "primary",
    },
    {
      label: "Installments & Balloons",
      value: formatPkrCompact(
        String(
          Number(s.installmentsTotalPkr) +
            Number(s.balloonTotalPkr) +
            Number(s.possessionTotalPkr),
        ),
      ),
      subValue: `${s.installmentsCount} inst · ${s.balloonCount} balloon · ${s.possessionCount} poss`,
      tone: "neutral",
    },
    {
      label: "Surcharges Due",
      value: formatPkrCompact(s.surchargeOutstandingPkr),
      subValue: `Collected: ${formatPkrCompact(s.surchargeCollectedPkr)}`,
      tone: parseDecimal(s.surchargeOutstandingPkr) > 0n ? "sold" : "neutral",
    },
  ];

  const tabs: Array<{ key: CategoryTab; label: string; total: string; count: number }> = [
    {
      key: "tokens",
      label: "Token Amount",
      total: s.tokenTotalPkr,
      count: s.tokenCount,
    },
    {
      key: "downPayments",
      label: "Down Payment",
      total: s.downPaymentTotalPkr,
      count: s.downPaymentCount,
    },
    {
      key: "installments",
      label: "Installments",
      total: s.installmentsTotalPkr,
      count: s.installmentsCount,
    },
    {
      key: "possessions",
      label: "Possession Payment",
      total: s.possessionTotalPkr,
      count: s.possessionCount,
    },
    {
      key: "balloons",
      label: "Balloon Payment",
      total: s.balloonTotalPkr,
      count: s.balloonCount,
    },
    {
      key: "surcharges",
      label: "Surcharges",
      total: s.surchargeOutstandingPkr,
      count: data.surcharges.length,
    },
  ];

  return (
    <ReportShell
      title="Collections Management Report"
      description="Detailed collection breakdown across Token Amounts, Down Payments, Installments, Possession Payments, Annual Balloon Payments, and Surcharges."
      exportType="collections"
      stats={stats}
      filterConfig={{
        showFloors: true,
        showCategories: true,
        showSearch: true,
        searchPlaceholder: "Search customer, CNIC, unit, receipt…",
      }}
      filterOptions={filterOptions}
    >
      {/* Category Summary Breakdown Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`card cursor-pointer p-3.5 text-left transition-all ${
                isActive
                  ? "border-primary bg-primary-soft/30 ring-1 ring-primary/30"
                  : "hover:border-line-strong"
              }`}
            >
              <p className="text-[11px] font-medium text-ink-muted">{tab.label}</p>
              <p className="mt-1 text-[15px] font-semibold text-ink tabular-nums">
                {formatPkrCompact(tab.total)}
              </p>
              <p className="mt-0.5 text-[10px] text-ink-muted tabular-nums">
                {tab.key === "surcharges"
                  ? `${tab.count} overdue · waived ${formatPkrCompact(s.surchargeWaivedPkr)}`
                  : `${tab.count} record${tab.count === 1 ? "" : "s"}`}
              </p>
            </button>
          );
        })}
      </div>

      {/* Active Category Detail Table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line bg-subtle/40 px-4 py-3">
          <div>
            <h3 className="text-[14px] font-semibold text-ink">
              {tabs.find((t) => t.key === activeTab)?.label} Details
            </h3>
            <p className="text-[11px] text-ink-muted">
              {activeTab === "surcharges"
                ? "0.1% per overdue day beyond 30-day grace period, net of waivers and collections."
                : "Filtered transactions within selected reporting window."}
            </p>
          </div>
        </div>

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
              <div className="py-10 text-center text-[13px] text-ink-muted">
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
                        <p className="font-mono text-[10px] text-ink-muted">
                          {row.clientCnic}
                        </p>
                      </td>
                      <td className="px-4 py-2.5">
                        <Link
                          href={`/bookings/${row.bookingId}` as never}
                          className="unit-code font-mono font-medium text-primary hover:underline"
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
    </ReportShell>
  );
}
