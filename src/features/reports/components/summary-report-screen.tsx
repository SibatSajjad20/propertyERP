"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { formatPkr, formatPkrCompact } from "@/lib/money";
import { ReportShell, type ReportStatCard } from "./report-shell";
import { Panel } from "@/components/ui/panel";
import type { FilterOptions, SummaryReportData } from "../queries";

const CollectionsAreaChart = dynamic(
  () => import("./collections-area-chart").then((m) => m.CollectionsAreaChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-[240px] w-full animate-pulse rounded-[8px] bg-subtle" />
    ),
  },
);

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
      label: "Discounts Given",
      value: formatPkrCompact(data.periodMetrics.discountsGivenPkr),
      subValue: `${data.periodMetrics.discountsCount} discounts`,
      tone: "neutral",
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
  ];

  // Compute Floor Ledger Summary totals
  const floorTotals = React.useMemo(() => {
    let units = 0;
    let available = 0;
    let booked = 0;
    let sold = 0;
    let totalVal = 0;
    let soldVal = 0;

    for (const f of data.floorBreakdown) {
      units += f.totalUnits;
      available += f.availableCount;
      booked += f.bookedCount;
      sold += f.soldCount;
      totalVal += Number(f.totalValuePkr) || 0;
      soldVal += Number(f.soldValuePkr) || 0;
    }

    return { units, available, booked, sold, totalVal, soldVal };
  }, [data.floorBreakdown]);

  // Compute Category Mix total units
  const totalCategoryUnits = React.useMemo(() => {
    return data.categoryBreakdown.reduce((sum, c) => sum + c.totalUnits, 0);
  }, [data.categoryBreakdown]);

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

          <div className="card rounded-[12px] border-l-4 border-l-primary p-4">
            <span className="text-[11px] font-medium tracking-wider text-ink-muted uppercase">
              Reserved Units
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-[22px] font-semibold text-ink tabular-nums">
                {data.unitsByStatus.reserved.count}
              </span>
              <span className="text-[13px] font-medium text-primary tabular-nums">
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
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          <div className="card rounded-[12px] p-4 lg:col-span-2">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <h3 className="text-[14px] font-semibold text-ink">
                  Collections by Month
                </h3>
                <p className="text-[11px] text-ink-muted">
                  Gross payment inflow over the past 12 months
                </p>
              </div>
            </div>
            <div className="h-[240px] w-full">
              <CollectionsAreaChart data={data.monthlyCollections} />
            </div>
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
                  <span className="text-[18px] font-semibold text-primary tabular-nums">
                    {data.periodMetrics.buybacks.count}
                  </span>
                  <span className="text-[13px] font-medium text-primary tabular-nums">
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

        {/* Floor Breakdown Table with bold total row */}
        <div className="overflow-hidden rounded-[12px] border border-[var(--line)] bg-[var(--surface)]">
          <div className="border-b border-line px-4 py-3">
            <h3 className="text-[14px] font-semibold text-ink">Floor Ledger Summary</h3>
            <p className="text-[11px] text-ink-muted">
              Inventory distribution and sold value aggregated by level
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-[12px]">
              <thead className="h-[38px] border-b border-[var(--line)] bg-[#FAFBFC] text-[12px] font-medium text-[var(--ink-muted)] select-none">
                <tr>
                  <th className="px-4 font-medium">Floor</th>
                  <th className="px-3 font-medium">Block</th>
                  <th className="px-3 text-right font-medium">Units</th>
                  <th className="px-3 text-right font-medium">Available</th>
                  <th className="px-3 text-right font-medium">Booked</th>
                  <th className="px-3 text-right font-medium">Sold</th>
                  <th className="px-4 text-right font-medium">Total Unit Value</th>
                  <th className="px-4 text-right font-medium">Total Sold Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {data.floorBreakdown.map((f) => (
                  <tr
                    key={f.floorId}
                    className="h-[44px] transition-colors hover:bg-[#F8FAFC]"
                  >
                    <td className="px-4 py-2 font-medium text-ink">{f.floorName}</td>
                    <td className="px-3 py-2 text-ink-muted">{f.blockName}</td>
                    <td className="px-3 py-2 text-right text-ink tabular-nums">
                      {f.totalUnits}
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-available tabular-nums">
                      {f.availableCount}
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-primary tabular-nums">
                      {f.bookedCount}
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-sold tabular-nums">
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
              <tfoot className="h-[44px] border-t-2 border-[var(--line)] bg-[#FAFBFC] font-semibold text-ink">
                <tr>
                  <td className="px-4 py-2">Total</td>
                  <td className="px-3 py-2 text-ink-muted">—</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {floorTotals.units}
                  </td>
                  <td className="px-3 py-2 text-right text-available tabular-nums">
                    {floorTotals.available}
                  </td>
                  <td className="px-3 py-2 text-right text-primary tabular-nums">
                    {floorTotals.booked}
                  </td>
                  <td className="px-3 py-2 text-right text-sold tabular-nums">
                    {floorTotals.sold}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {formatPkrCompact(floorTotals.totalVal.toString())}
                  </td>
                  <td className="px-4 py-2 text-right text-sold tabular-nums">
                    {formatPkrCompact(floorTotals.soldVal.toString())}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Category Breakdown Horizontal Bars */}
        <div className="overflow-hidden rounded-[12px] border border-[var(--line)] bg-[var(--surface)] p-5">
          <div className="mb-4">
            <h3 className="text-[14px] font-semibold text-ink">Category Mix</h3>
            <p className="text-[11px] text-ink-muted">
              Commercial, retail, food court, and office space utilization
            </p>
          </div>
          <div className="space-y-4">
            {data.categoryBreakdown.map((c) => {
              const pct =
                totalCategoryUnits > 0
                  ? Math.round((c.totalUnits / totalCategoryUnits) * 100)
                  : 0;
              return (
                <div key={c.categoryId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-[12.5px]">
                    <span className="font-medium text-ink">{c.categoryName}</span>
                    <span className="text-muted tabular-nums">
                      {c.totalUnits} units · {pct}% · {formatPkrCompact(c.totalValuePkr)}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-[4px] bg-[#EDF0F3]">
                    <div
                      className="h-full rounded-[4px] bg-primary transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ReportShell>
  );
}
