"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pill } from "@/components/ui/badge";
import { formatPkr, formatPkrCompact } from "@/lib/money";
import { ReportShell, type ReportStatCard } from "./report-shell";
import type { FilterOptions, ReservedUnitsReportData } from "../queries";

export interface ReservedReportScreenProps {
  data: ReservedUnitsReportData;
  filterOptions: FilterOptions;
}

export function ReservedReportScreen({ data, filterOptions }: ReservedReportScreenProps) {
  const router = useRouter();

  const stats: ReportStatCard[] = [
    {
      label: "Total Reservations",
      value: data.kpi.totalReserved.toString(),
      tone: "accent",
    },
    {
      label: "Tokens Collected",
      value: formatPkrCompact(data.kpi.totalTokenAmountPkr),
      subValue: `${data.kpi.tokenCount} tokens (${formatPkr(data.kpi.totalTokenAmountPkr)})`,
      tone: "accent",
    },
    {
      label: "Active Holds",
      value: data.kpi.activeCount.toString(),
      tone: "available",
    },
    {
      label: "Converted to Booking",
      value: data.kpi.convertedCount.toString(),
      tone: "primary",
    },
    {
      label: "Expired",
      value: data.kpi.expiredCount.toString(),
      tone: "sold",
    },
    {
      label: "Cancelled",
      value: data.kpi.cancelledCount.toString(),
      tone: "neutral",
    },
  ];

  return (
    <ReportShell
      title="Reserved Units Report"
      description="Temporary holding deposits and time-limited options with real-time countdown to expiration."
      exportType="reserved"
      stats={stats}
      filterConfig={{
        showFloors: true,
        showStatus: true,
        statusOptions: [
          { value: "ACTIVE", label: "Active" },
          { value: "CONVERTED", label: "Converted" },
          { value: "EXPIRED", label: "Expired" },
          { value: "CANCELLED", label: "Cancelled" },
        ],
        showSearch: true,
        searchPlaceholder: "Search unit or client...",
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
                <th className="px-4 font-medium">Client</th>
                <th className="px-3 font-medium">Phone</th>
                <th className="px-3 text-right font-medium">Token (PKR)</th>
                <th className="px-3 font-medium">Reserved On</th>
                <th className="px-3 font-medium">Expires At</th>
                <th className="px-3 font-medium">Time Left</th>
                <th className="px-3 text-center font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {data.rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-ink-muted">
                    No reservations found for the selected filters.
                  </td>
                </tr>
              ) : (
                data.rows.map((row) => (
                  <tr
                    key={row.reservationId}
                    onClick={() => router.push(`/reservations/${row.reservationId}`)}
                    className="h-[44px] cursor-pointer transition-colors hover:bg-[#F8FAFC]"
                  >
                    <td className="unit-code px-4 py-2 text-[12px] font-medium text-primary">
                      {row.unitCode}
                    </td>
                    <td className="px-3 py-2 text-ink-muted">{row.floorName}</td>
                    <td className="px-4 py-2 font-medium text-ink">{row.clientName}</td>
                    <td className="px-3 py-2 font-sans text-[11px] text-ink-muted tabular-nums">
                      {row.clientPhone}
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-ink tabular-nums">
                      {formatPkr(row.tokenAmountPkr)}
                    </td>
                    <td className="px-3 py-2 text-ink tabular-nums">
                      {new Date(row.reservedOn).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-3 py-2 text-ink tabular-nums">
                      {new Date(row.expiresAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-3 py-2">
                      {row.isExpired ? (
                        <span className="font-semibold text-sold">Expired</span>
                      ) : (
                        <span className="text-ink tabular-nums">{row.timeLeft}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Pill
                        tone={
                          row.status === "ACTIVE"
                            ? "available"
                            : row.status === "CONVERTED"
                              ? "primary"
                              : row.status === "EXPIRED"
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
