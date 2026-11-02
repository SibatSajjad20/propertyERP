"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { formatPkr, formatPkrCompact } from "@/lib/money";
import { ReportShell, type ReportStatCard } from "./report-shell";
import type { FilterOptions, SoldUnitsReportData } from "../queries";

export interface SoldReportScreenProps {
  data: SoldUnitsReportData;
  filterOptions: FilterOptions;
}

export function SoldReportScreen({ data, filterOptions }: SoldReportScreenProps) {
  const router = useRouter();

  const stats: ReportStatCard[] = [
    {
      label: "Total Units Sold",
      value: data.kpi.totalSoldUnits.toString(),
      tone: "sold",
    },
    {
      label: "Total Sales Value",
      value: formatPkrCompact(data.kpi.totalSalesValuePkr),
      tone: "primary",
    },
    {
      label: "Avg Rate / Sqft",
      value: `Rs ${data.kpi.averageRatePerSqftPkr}`,
      tone: "accent",
    },
    {
      label: "Units Bought Back",
      value: data.kpi.boughtBackCount.toString(),
      tone: data.kpi.boughtBackCount > 0 ? "accent" : "neutral",
    },
  ];

  return (
    <ReportShell
      title="Sold Units Report"
      description="Itemized record of all closed transactions with listing vs sale price, buyer credentials, and buyback status."
      exportType="sold"
      stats={stats}
      filterConfig={{
        showFloors: true,
        showCategories: true,
        showSearch: true,
        searchPlaceholder: "Search unit, client, or CNIC...",
      }}
      filterOptions={filterOptions}
    >
      <div className="card overflow-hidden rounded-[12px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-[12px]">
            <thead className="border-b border-line bg-subtle/60 text-[11px] font-medium tracking-wider text-ink-muted uppercase">
              <tr>
                <th className="px-4 py-2.5">Unit</th>
                <th className="px-3 py-2.5">Floor</th>
                <th className="px-3 py-2.5">Category</th>
                <th className="px-3 py-2.5 text-right">Area (sqft)</th>
                <th className="px-4 py-2.5">Client</th>
                <th className="px-3 py-2.5">CNIC</th>
                <th className="px-3 py-2.5 text-right">List Price</th>
                <th className="px-3 py-2.5 text-right">Discount</th>
                <th className="px-4 py-2.5 text-right">Sale Price</th>
                <th className="px-3 py-2.5">Sold Date</th>
                <th className="px-3 py-2.5">Source</th>
                <th className="px-3 py-2.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {data.rows.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-ink-muted">
                    No sold units found for the selected filters.
                  </td>
                </tr>
              ) : (
                data.rows.map((row) => (
                  <tr
                    key={row.saleId}
                    onClick={() => router.push(`/sold/${row.saleId}`)}
                    className="cursor-pointer transition-colors hover:bg-subtle/40"
                  >
                    <td className="px-4 py-2.5 font-mono text-[11px] font-medium text-ink">
                      {row.unitCode}
                    </td>
                    <td className="px-3 py-2.5 text-ink-muted">{row.floorName}</td>
                    <td className="px-3 py-2.5 text-ink-muted">{row.categoryName}</td>
                    <td className="px-3 py-2.5 text-right text-ink tabular-nums">
                      {row.netAreaSqft}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-ink">{row.clientName}</td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-ink-muted">
                      {row.clientCnic}
                    </td>
                    <td className="px-3 py-2.5 text-right text-ink-muted tabular-nums">
                      {formatPkr(row.listPrice)}
                    </td>
                    <td className="px-3 py-2.5 text-right text-sold tabular-nums">
                      {row.discount !== "0.00" ? formatPkr(row.discount) : "-"}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-ink tabular-nums">
                      {formatPkr(row.salePrice)}
                    </td>
                    <td className="px-3 py-2.5 text-ink-muted tabular-nums">
                      {new Date(row.soldDate).toISOString().split("T")[0]}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex rounded-full bg-subtle px-2 py-0.5 text-[10px] font-medium text-ink">
                        {row.source}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {row.isBoughtBack ? (
                        <Badge tone="accent">Bought Back</Badge>
                      ) : (
                        <Badge tone="sold">Sold</Badge>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ReportShell>
  );
}
