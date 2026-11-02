"use client";

import * as React from "react";
import { formatPkr, formatPkrCompact } from "@/lib/money";
import { CollectionsAreaChart } from "./collections-area-chart";
import { ReportShell, type ReportStatCard } from "./report-shell";
import type { FilterOptions, SummaryReportData } from "../queries";

export interface SummaryReportScreenProps {
  data: SummaryReportData;
  filterOptions: FilterOptions;
}

export function SummaryReportScreen({ data, filterOptions }: SummaryReportScreenProps) {
  const stats: ReportStatCard[] = [
    {
      label: "Period Sales",
      value: formatPkrCompact(data.periodMetrics.salesValuePkr),
      subValue: `${data.periodMetrics.salesCount} sold in period`,
      tone: "primary",
    },
    {
      label: "Net Collections",
      value: formatPkrCompact(data.periodMetrics.collectedPkr),
      subValue: `Gross: ${formatPkrCompact(data.periodMetrics.grossCollectedPkr)}`,
      tone: "available",
    },
    {
      label: "Outstanding",
      value: formatPkrCompact(data.periodMetrics.outstandingReceivablesPkr),
      subValue: "Active booking balance",
      tone: "accent",
    },
    {
      label: "Overdue Amount",
      value: formatPkrCompact(data.periodMetrics.overdueAmountPkr),
      subValue: `${data.periodMetrics.overdueCount} installments overdue`,
      tone: "sold",
    },
    {
      label: "Discounts Given",
      value: formatPkrCompact(data.periodMetrics.discountsGivenPkr),
      subValue: `${data.periodMetrics.discountsCount} discounts`,
      tone: "neutral",
    },
  ];

  return (
    <ReportShell
      title="Executive Summary"
      description="Holistic performance overview across inventory status, period sales, net cash collections, and overdue receivables."
      exportType="summary"
      stats={stats}
      filterConfig={{
        showFloors: true,
        showCategories: true,
      }}
      filterOptions={filterOptions}
    >
      <div className="flex flex-col gap-6">
        {/* Status Mix Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="card rounded-[12px] border-l-4 border-l-available p-4">
            <span className="text-[11px] font-medium tracking-wider text-ink-muted uppercase">
              Available Units
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-[22px] font-semibold text-ink tabular-nums">
                {data.unitsByStatus.available.count}
              </span>
              <span className="text-[13px] font-medium text-available tabular-nums">
                {formatPkrCompact(data.unitsByStatus.available.valuePkr)}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-ink-muted">Ready for booking/sale</p>
          </div>

          <div className="card rounded-[12px] border-l-4 border-l-accent p-4">
            <span className="text-[11px] font-medium tracking-wider text-ink-muted uppercase">
              Reserved Units
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-[22px] font-semibold text-ink tabular-nums">
                {data.unitsByStatus.reserved.count}
              </span>
              <span className="text-[13px] font-medium text-accent tabular-nums">
                {formatPkrCompact(data.unitsByStatus.reserved.valuePkr)}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-ink-muted">Temporary client holds</p>
          </div>

          <div className="card rounded-[12px] border-l-4 border-l-primary p-4">
            <span className="text-[11px] font-medium tracking-wider text-ink-muted uppercase">
              Booked Units
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-[22px] font-semibold text-ink tabular-nums">
                {data.unitsByStatus.booked.count}
              </span>
              <span className="text-[13px] font-medium text-primary tabular-nums">
                {formatPkrCompact(data.unitsByStatus.booked.valuePkr)}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-ink-muted">Installment plans active</p>
          </div>

          <div className="card rounded-[12px] border-l-4 border-l-sold p-4">
            <span className="text-[11px] font-medium tracking-wider text-ink-muted uppercase">
              Sold Units
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-[22px] font-semibold text-ink tabular-nums">
                {data.unitsByStatus.sold.count}
              </span>
              <span className="text-[13px] font-medium text-sold tabular-nums">
                {formatPkrCompact(data.unitsByStatus.sold.valuePkr)}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-ink-muted">100% paid / completed</p>
          </div>
        </div>

        {/* Collections Chart + Reversals Summary */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="card rounded-[12px] p-4 lg:col-span-2">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <h3 className="text-[14px] font-semibold text-ink">
                  Monthly Collections Trend
                </h3>
                <p className="text-[11px] text-ink-muted">
                  Gross payment inflow over the past 12 months
                </p>
              </div>
            </div>
            <CollectionsAreaChart data={data.monthlyCollections} />
          </div>

          <div className="card flex flex-col justify-between rounded-[12px] p-4">
            <div>
              <h3 className="text-[14px] font-semibold text-ink">
                Period Reversals &amp; Buybacks
              </h3>
              <p className="text-[11px] text-ink-muted">
                Refund deductions and unit buybacks recorded
              </p>
            </div>

            <div className="my-4 flex flex-col gap-3">
              <div className="rounded-[8px] border border-line bg-subtle/40 p-3">
                <span className="text-[11px] font-medium text-ink-muted uppercase">
                  Refunds on Cancellation
                </span>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-[18px] font-semibold text-sold tabular-nums">
                    {data.periodMetrics.refunds.count}
                  </span>
                  <span className="text-[13px] font-medium text-sold tabular-nums">
                    {formatPkr(data.periodMetrics.refunds.totalPkr)}
                  </span>
                </div>
              </div>

              <div className="rounded-[8px] border border-line bg-subtle/40 p-3">
                <span className="text-[11px] font-medium text-ink-muted uppercase">
                  Buybacks of Sold Units
                </span>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-[18px] font-semibold text-accent tabular-nums">
                    {data.periodMetrics.buybacks.count}
                  </span>
                  <span className="text-[13px] font-medium text-accent tabular-nums">
                    {formatPkr(data.periodMetrics.buybacks.totalPkr)}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-line pt-3 text-[11px] text-ink-muted">
              Reversals automatically return units to AVAILABLE inventory with recorded
              audit logs.
            </div>
          </div>
        </div>

        {/* Floor Breakdown Table */}
        <div className="card overflow-hidden rounded-[12px]">
          <div className="border-b border-line px-4 py-3">
            <h3 className="text-[14px] font-semibold text-ink">Floor Ledger Summary</h3>
            <p className="text-[11px] text-ink-muted">
              Inventory distribution and sold value aggregated by level
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-[12px]">
              <thead className="border-b border-line bg-subtle/60 text-[11px] font-medium tracking-wider text-ink-muted uppercase">
                <tr>
                  <th className="px-4 py-2.5">Floor</th>
                  <th className="px-3 py-2.5">Block</th>
                  <th className="px-3 py-2.5 text-right">Units</th>
                  <th className="px-3 py-2.5 text-right">Available</th>
                  <th className="px-3 py-2.5 text-right">Booked</th>
                  <th className="px-3 py-2.5 text-right">Sold</th>
                  <th className="px-4 py-2.5 text-right">Total Unit Value</th>
                  <th className="px-4 py-2.5 text-right">Total Sold Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {data.floorBreakdown.map((f) => (
                  <tr key={f.floorId} className="transition-colors hover:bg-subtle/40">
                    <td className="px-4 py-2 font-medium text-ink">{f.floorName}</td>
                    <td className="px-3 py-2 text-ink-muted">{f.blockName}</td>
                    <td className="px-3 py-2 text-right text-ink tabular-nums">
                      {f.totalUnits}
                    </td>
                    <td className="px-3 py-2 text-right text-available tabular-nums">
                      {f.availableCount}
                    </td>
                    <td className="px-3 py-2 text-right text-primary tabular-nums">
                      {f.bookedCount}
                    </td>
                    <td className="px-3 py-2 text-right text-sold tabular-nums">
                      {f.soldCount}
                    </td>
                    <td className="px-4 py-2 text-right font-medium text-ink tabular-nums">
                      {formatPkrCompact(f.totalValuePkr)}
                    </td>
                    <td className="px-4 py-2 text-right font-semibold text-sold tabular-nums">
                      {formatPkrCompact(f.soldValuePkr)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category Breakdown Table */}
        <div className="card overflow-hidden rounded-[12px]">
          <div className="border-b border-line px-4 py-3">
            <h3 className="text-[14px] font-semibold text-ink">Category Mix</h3>
            <p className="text-[11px] text-ink-muted">
              Commercial, retail, food court, and office space utilization
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-[12px]">
              <thead className="border-b border-line bg-subtle/60 text-[11px] font-medium tracking-wider text-ink-muted uppercase">
                <tr>
                  <th className="px-4 py-2.5">Category</th>
                  <th className="px-3 py-2.5 text-right">Units</th>
                  <th className="px-3 py-2.5 text-right">Available</th>
                  <th className="px-3 py-2.5 text-right">Booked</th>
                  <th className="px-3 py-2.5 text-right">Sold</th>
                  <th className="px-4 py-2.5 text-right">Total Unit Value</th>
                  <th className="px-4 py-2.5 text-right">Total Sold Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {data.categoryBreakdown.map((c) => (
                  <tr key={c.categoryId} className="transition-colors hover:bg-subtle/40">
                    <td className="px-4 py-2 font-medium text-ink">{c.categoryName}</td>
                    <td className="px-3 py-2 text-right text-ink tabular-nums">
                      {c.totalUnits}
                    </td>
                    <td className="px-3 py-2 text-right text-available tabular-nums">
                      {c.availableCount}
                    </td>
                    <td className="px-3 py-2 text-right text-primary tabular-nums">
                      {c.bookedCount}
                    </td>
                    <td className="px-3 py-2 text-right text-sold tabular-nums">
                      {c.soldCount}
                    </td>
                    <td className="px-4 py-2 text-right font-medium text-ink tabular-nums">
                      {formatPkrCompact(c.totalValuePkr)}
                    </td>
                    <td className="px-4 py-2 text-right font-semibold text-sold tabular-nums">
                      {formatPkrCompact(c.soldValuePkr)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ReportShell>
  );
}
