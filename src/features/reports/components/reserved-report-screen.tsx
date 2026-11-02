"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
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
      <div className="card overflow-hidden rounded-[12px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-[12px]">
            <thead className="border-b border-line bg-subtle/60 text-[11px] font-medium tracking-wider text-ink-muted uppercase">
              <tr>
                <th className="px-4 py-2.5">Unit</th>
                <th className="px-3 py-2.5">Floor</th>
                <th className="px-4 py-2.5">Client</th>
                <th className="px-3 py-2.5">Phone</th>
                <th className="px-3 py-2.5">Reserved On</th>
                <th className="px-3 py-2.5">Expires At</th>
                <th className="px-3 py-2.5">Time Left</th>
                <th className="px-3 py-2.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {data.rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-ink-muted">
                    No reservations found for the selected filters.
                  </td>
                </tr>
              ) : (
                data.rows.map((row) => (
                  <tr
                    key={row.reservationId}
                    onClick={() => router.push(`/reservations/${row.reservationId}`)}
                    className="cursor-pointer transition-colors hover:bg-subtle/40"
                  >
                    <td className="px-4 py-2.5 font-mono text-[11px] font-medium text-ink">
                      {row.unitCode}
                    </td>
                    <td className="px-3 py-2.5 text-ink-muted">{row.floorName}</td>
                    <td className="px-4 py-2.5 font-medium text-ink">{row.clientName}</td>
                    <td className="px-3 py-2.5 font-sans text-ink-muted tabular-nums">
                      {row.clientPhone}
                    </td>
                    <td className="px-3 py-2.5 text-ink-muted tabular-nums">
                      {new Date(row.reservedOn).toISOString().split("T")[0]}
                    </td>
                    <td className="px-3 py-2.5 text-ink-muted tabular-nums">
                      {new Date(row.expiresAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={
                          row.isExpired
                            ? "font-medium text-sold"
                            : row.status === "ACTIVE"
                              ? "font-medium text-accent"
                              : "text-ink-muted"
                        }
                      >
                        {row.timeLeft}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <Badge
                        tone={
                          row.status === "ACTIVE"
                            ? row.isExpired
                              ? "sold"
                              : "accent"
                            : row.status === "CONVERTED"
                              ? "available"
                              : "muted"
                        }
                      >
                        {row.isExpired && row.status === "ACTIVE"
                          ? "EXPIRED"
                          : row.status}
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
