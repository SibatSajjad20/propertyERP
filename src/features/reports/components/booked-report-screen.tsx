"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pill } from "@/components/ui/badge";
import { formatPkr, formatPkrCompact } from "@/lib/money";
import { ReportShell, type ReportStatCard } from "./report-shell";
import type { BookedUnitsReportData, FilterOptions } from "../queries";

export interface BookedReportScreenProps {
  data: BookedUnitsReportData;
  filterOptions: FilterOptions;
}

export function BookedReportScreen({ data, filterOptions }: BookedReportScreenProps) {
  const router = useRouter();

  const stats: ReportStatCard[] = [
    {
      label: "Total Bookings",
      value: data.kpi.totalBookings.toString(),
      tone: "primary",
    },
    {
      label: "Contract Value",
      value: formatPkrCompact(data.kpi.totalNetPricePkr),
      tone: "primary",
    },
    {
      label: "Total Collected",
      value: formatPkrCompact(data.kpi.totalPaidPkr),
      tone: "available",
    },
    {
      label: "Remaining Balance",
      value: formatPkrCompact(data.kpi.totalBalancePkr),
      tone: "accent",
    },
    {
      label: "Total Overdue",
      value: formatPkrCompact(data.kpi.totalOverduePkr),
      tone: "sold",
    },
  ];

  return (
    <ReportShell
      title="Booked Units Report"
      description="Active installment contracts tracking payment schedules, progress percentage, and overdue exposure."
      exportType="booked"
      stats={stats}
      filterConfig={{
        showFloors: true,
        showCategories: true,
        showStatus: true,
        statusOptions: [
          { value: "ACTIVE", label: "Active" },
          { value: "COMPLETED", label: "Completed" },
          { value: "CANCELLED", label: "Cancelled" },
          { value: "RETURNED", label: "Returned" },
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
                <th className="px-3 font-medium">Unit</th>
                <th className="px-4 font-medium">Client</th>
                <th className="px-3 font-medium">CNIC</th>
                <th className="px-3 font-medium">Phone</th>
                <th className="px-3 text-right font-medium">Net Price</th>
                <th className="px-3 text-right font-medium">Paid</th>
                <th className="px-3 text-right font-medium">Balance</th>
                <th className="w-32 px-4 font-medium">% Paid</th>
                <th className="px-3 font-medium">Plan</th>
                <th className="px-3 font-medium">Next Due</th>
                <th className="px-3 text-right font-medium">Overdue</th>
                <th className="px-3 text-center font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {data.rows.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-4 py-8 text-center text-ink-muted">
                    No booking records found for the selected filters.
                  </td>
                </tr>
              ) : (
                data.rows.map((row) => (
                  <tr
                    key={row.bookingId}
                    onClick={() => router.push(`/bookings/${row.bookingId}`)}
                    className="h-[44px] cursor-pointer transition-colors hover:bg-[#F8FAFC]"
                  >
                    <td className="px-4 py-2 font-sans text-[11px] font-semibold text-primary tabular-nums">
                      {row.bookingNo}
                    </td>
                    <td className="unit-code px-3 py-2 text-[12px] font-medium text-ink">
                      {row.unitCode}
                    </td>
                    <td className="px-4 py-2 font-medium text-ink">{row.clientName}</td>
                    <td className="px-3 py-2 font-sans text-[11px] text-ink-muted tabular-nums">
                      {row.clientCnic}
                    </td>
                    <td className="px-3 py-2 font-sans text-[11px] text-ink-muted tabular-nums">
                      {row.clientPhone}
                    </td>
                    <td className="px-3 py-2 text-right text-ink tabular-nums">
                      {formatPkr(row.netPrice)}
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-available tabular-nums">
                      {formatPkr(row.paid)}
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-ink tabular-nums">
                      {formatPkr(row.balance)}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#EDF0F3]">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-300"
                            style={{ width: `${row.paidPercent}%` }}
                          />
                        </div>
                        <span className="w-8 text-right font-sans text-[11px] text-ink-muted tabular-nums">
                          {row.paidPercent}%
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-[11px] text-ink-muted capitalize">
                        {row.plan.toLowerCase()}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-ink-muted tabular-nums">
                      {row.nextDueDate
                        ? new Date(row.nextDueDate).toISOString().split("T")[0]
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {row.overdueAmount !== "0.00" ? (
                        <span className="font-semibold text-sold">
                          {formatPkr(row.overdueAmount)}
                        </span>
                      ) : (
                        <span className="text-ink-muted">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Pill
                        tone={
                          row.status === "ACTIVE"
                            ? "primary"
                            : row.status === "COMPLETED"
                              ? "sold"
                              : "muted"
                        }
                      >
                        {row.status}
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
