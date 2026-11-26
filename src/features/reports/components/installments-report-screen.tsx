"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pill } from "@/components/ui/badge";
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
      <div className="overflow-hidden rounded-[8px] border border-[var(--line)] bg-[var(--surface)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-[12px]">
            <thead className="h-[38px] border-b border-[var(--line)] bg-[#FAFBFC] text-[12px] font-medium text-[var(--ink-muted)] select-none">
              <tr>
                <th className="px-4 font-medium">Booking #</th>
                <th className="px-3 font-medium">Client</th>
                <th className="px-3 font-medium">Unit</th>
                <th className="px-2 text-center font-medium">Seq</th>
                <th className="px-3 font-medium">Due Date</th>
                <th className="px-3 text-right font-medium">Amount</th>
                <th className="px-3 text-right font-medium">Paid</th>
                <th className="px-3 text-right font-medium">Balance</th>
                <th className="px-3 font-medium">Receipt #</th>
                <th className="px-3 text-center font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {data.rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-ink-muted">
                    No installments found for the selected filters.
                  </td>
                </tr>
              ) : (
                data.rows.map((row) => {
                  const isOverdue = row.status === "OVERDUE";
                  return (
                    <tr
                      key={row.installmentId}
                      onClick={() =>
                        router.push(`/installments?q=${row.bookingNo}` as never)
                      }
                      className="h-[44px] cursor-pointer transition-colors hover:bg-[#F8FAFC]"
                    >
                      <td className="px-4 py-2 font-sans text-[11px] font-semibold text-primary tabular-nums">
                        {row.bookingNo}
                      </td>
                      <td className="px-3 py-2 font-medium text-ink">{row.clientName}</td>
                      <td className="unit-code px-3 py-2 text-[12px] font-medium text-ink">
                        {row.unitCode}
                      </td>
                      <td className="px-2 py-2 text-center font-sans text-ink-muted tabular-nums">
                        #{row.seq}
                      </td>
                      <td className="px-3 py-2 tabular-nums">
                        <span
                          className={isOverdue ? "font-semibold text-sold" : "text-ink"}
                        >
                          {new Date(row.dueDate).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right text-ink tabular-nums">
                        {formatPkr(row.amount)}
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-available tabular-nums">
                        {formatPkr(row.paid)}
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-ink tabular-nums">
                        {formatPkr(row.balance)}
                      </td>
                      <td className="max-w-[140px] truncate px-3 py-2 font-sans text-[11px] text-ink-muted tabular-nums">
                        {row.receiptNos || "—"}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Pill
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
                        </Pill>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ReportShell>
  );
}
