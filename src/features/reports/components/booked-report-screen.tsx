"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
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
      <div className="card overflow-hidden rounded-[12px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-[12px]">
            <thead className="border-b border-line bg-subtle/60 text-[11px] font-medium tracking-wider text-ink-muted uppercase">
              <tr>
                <th className="px-4 py-2.5">Booking #</th>
                <th className="px-3 py-2.5">Unit</th>
                <th className="px-4 py-2.5">Client</th>
                <th className="px-3 py-2.5">CNIC</th>
                <th className="px-3 py-2.5">Phone</th>
                <th className="px-3 py-2.5 text-right">Net Price</th>
                <th className="px-3 py-2.5 text-right">Paid</th>
                <th className="px-3 py-2.5 text-right">Balance</th>
                <th className="w-32 px-4 py-2.5">% Paid</th>
                <th className="px-3 py-2.5">Plan</th>
                <th className="px-3 py-2.5">Next Due</th>
                <th className="px-3 py-2.5 text-right">Overdue</th>
                <th className="px-3 py-2.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
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
                    className="cursor-pointer transition-colors hover:bg-subtle/40"
                  >
                    <td className="px-4 py-2.5 font-mono text-[11px] font-medium text-primary">
                      {row.bookingNo}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-ink">
                      {row.unitCode}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-ink">{row.clientName}</td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-ink-muted">
                      {row.clientCnic}
                    </td>
                    <td className="px-3 py-2.5 font-sans text-ink-muted tabular-nums">
                      {row.clientPhone}
                    </td>
                    <td className="px-3 py-2.5 text-right text-ink tabular-nums">
                      {formatPkr(row.netPrice)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-available tabular-nums">
                      {formatPkr(row.paid)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-ink tabular-nums">
                      {formatPkr(row.balance)}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-subtle">
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
                    <td className="px-3 py-2.5">
                      <span className="text-[11px] text-ink-muted">
                        {row.plan.toLowerCase()}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-ink-muted tabular-nums">
                      {row.nextDueDate
                        ? new Date(row.nextDueDate).toISOString().split("T")[0]
                        : "-"}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {row.overdueAmount !== "0.00" ? (
                        <span className="font-semibold text-sold">
                          {formatPkr(row.overdueAmount)}
                        </span>
                      ) : (
                        <span className="text-ink-muted">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <Badge
                        tone={
                          row.status === "ACTIVE"
                            ? "primary"
                            : row.status === "COMPLETED"
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
