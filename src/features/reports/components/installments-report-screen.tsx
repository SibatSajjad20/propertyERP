"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { formatPkr, formatPkrCompact } from "@/lib/money";
import { ReportShell, type ReportStatCard } from "./report-shell";
import type { FilterOptions, InstallmentsReportData } from "../queries";

export interface InstallmentsReportScreenProps {
  data: InstallmentsReportData;
  filterOptions: FilterOptions;
}

export function InstallmentsReportScreen({
  data,
  filterOptions,
}: InstallmentsReportScreenProps) {
  const router = useRouter();

  const stats: ReportStatCard[] = [
    {
      label: "Total Installments",
      value: data.kpi.totalCount.toString(),
      tone: "primary",
    },
    {
      label: "Total Due",
      value: formatPkrCompact(data.kpi.totalDuePkr),
      tone: "primary",
    },
    {
      label: "Total Paid",
      value: formatPkrCompact(data.kpi.totalPaidPkr),
      tone: "available",
    },
    {
      label: "Remaining Balance",
      value: formatPkrCompact(data.kpi.totalBalancePkr),
      tone: "accent",
    },
    {
      label: "Overdue Amount",
      value: formatPkrCompact(data.kpi.overduePkr),
      subValue: `${data.kpi.overdueCount} installments past due`,
      tone: "sold",
    },
  ];

  return (
    <ReportShell
      title="Installments Report"
      description="Detailed ledger of every scheduled installment across all active bookings with waterfall payment tracking."
      exportType="installments"
      stats={stats}
      filterConfig={{
        showFloors: true,
        showStatus: true,
        statusOptions: [
          { value: "PENDING", label: "Pending" },
          { value: "PARTIAL", label: "Partial" },
          { value: "PAID", label: "Paid" },
          { value: "OVERDUE", label: "Overdue" },
        ],
        quickFilters: [
          { value: "all", label: "All" },
          { value: "due_this_week", label: "Due this week" },
          { value: "due_this_month", label: "Due this month" },
          { value: "overdue", label: "Overdue" },
        ],
        showSearch: true,
        searchPlaceholder: "Search booking #, unit, or client...",
      }}
      filterOptions={filterOptions}
    >
      <div className="card overflow-hidden rounded-[12px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-[12px]">
            <thead className="border-b border-line bg-subtle/60 text-[11px] font-medium tracking-wider text-ink-muted uppercase">
              <tr>
                <th className="px-4 py-2.5">Booking #</th>
                <th className="px-3 py-2.5">Client</th>
                <th className="px-3 py-2.5">Unit</th>
                <th className="px-2 py-2.5 text-center">Seq</th>
                <th className="px-3 py-2.5">Due Date</th>
                <th className="px-3 py-2.5 text-right">Amount</th>
                <th className="px-3 py-2.5 text-right">Paid</th>
                <th className="px-3 py-2.5 text-right">Balance</th>
                <th className="px-3 py-2.5">Receipt #</th>
                <th className="px-3 py-2.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {data.rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-ink-muted">
                    No installments found for the selected filters.
                  </td>
                </tr>
              ) : (
                data.rows.map((row) => (
                  <tr
                    key={row.installmentId}
                    onClick={() =>
                      router.push(`/installments?q=${row.bookingNo}` as never)
                    }
                    className="cursor-pointer transition-colors hover:bg-subtle/40"
                  >
                    <td className="px-4 py-2.5 font-mono text-[11px] font-medium text-primary">
                      {row.bookingNo}
                    </td>
                    <td className="px-3 py-2.5 font-medium text-ink">{row.clientName}</td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-ink">
                      {row.unitCode}
                    </td>
                    <td className="px-2 py-2.5 text-center font-sans text-ink-muted tabular-nums">
                      #{row.seq}
                    </td>
                    <td className="px-3 py-2.5 text-ink tabular-nums">
                      {new Date(row.dueDate).toISOString().split("T")[0]}
                    </td>
                    <td className="px-3 py-2.5 text-right text-ink tabular-nums">
                      {formatPkr(row.amount)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-available tabular-nums">
                      {formatPkr(row.paid)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-ink tabular-nums">
                      {formatPkr(row.balance)}
                    </td>
                    <td className="max-w-[140px] truncate px-3 py-2.5 font-mono text-[11px] text-ink-muted">
                      {row.receiptNos || "-"}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <Badge
                        tone={
                          row.status === "PAID"
                            ? "available"
                            : row.status === "PARTIAL"
                              ? "accent"
                              : row.status === "OVERDUE"
                                ? "sold"
                                : "muted"
                        }
                      >
                        {row.status}
                      </Badge>
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
