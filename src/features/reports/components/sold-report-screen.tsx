"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pill } from "@/components/ui/badge";
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
      <div className="overflow-hidden rounded-[8px] border border-[var(--line)] bg-[var(--surface)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-[12px]">
            <thead className="h-[38px] border-b border-[var(--line)] bg-[#FAFBFC] text-[12px] font-medium text-[var(--ink-muted)] select-none">
              <tr>
                <th className="px-4 font-medium">Unit</th>
                <th className="px-3 font-medium">Floor</th>
                <th className="px-3 font-medium">Category</th>
                <th className="px-3 text-right font-medium">Area (sqft)</th>
                <th className="px-4 font-medium">Client</th>
                <th className="px-3 font-medium">CNIC</th>
                <th className="px-3 text-right font-medium">List Price</th>
                <th className="px-3 text-right font-medium">Discount</th>
                <th className="px-4 text-right font-medium">Sale Price</th>
                <th className="px-3 font-medium">Sold Date</th>
                <th className="px-3 font-medium">Source</th>
                <th className="px-3 text-center font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
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
                    className="h-[44px] cursor-pointer transition-colors hover:bg-[#F8FAFC]"
                  >
                    <td className="unit-code px-4 py-2 text-[12px] font-semibold text-primary">
                      {row.unitCode}
                    </td>
                    <td className="px-3 py-2 text-ink-muted">{row.floorName}</td>
                    <td className="px-3 py-2 text-ink-muted">{row.categoryName}</td>
                    <td className="px-3 py-2 text-right text-ink tabular-nums">
                      {row.netAreaSqft}
                    </td>
                    <td className="px-4 py-2 font-medium text-ink">{row.clientName}</td>
                    <td className="px-3 py-2 font-sans text-[11px] text-ink-muted tabular-nums">
                      {row.clientCnic}
                    </td>
                    <td className="px-3 py-2 text-right text-ink-muted tabular-nums">
                      {formatPkr(row.listPrice)}
                    </td>
                    <td className="px-3 py-2 text-right text-ink-muted tabular-nums">
                      {row.discount !== "0.00" ? formatPkr(row.discount) : "—"}
                    </td>
                    <td className="px-4 py-2 text-right font-semibold text-ink tabular-nums">
                      {formatPkr(row.salePrice)}
                    </td>
                    <td className="px-3 py-2 font-sans text-ink tabular-nums">
                      {new Date(row.soldDate).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-3 py-2 text-[11px] text-ink-muted">{row.source}</td>
                    <td className="px-3 py-2 text-center">
                      <Pill tone={row.isBoughtBack ? "muted" : "sold"}>
                        {row.isBoughtBack ? "Bought Back" : "Sold"}
                      </Pill>
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
