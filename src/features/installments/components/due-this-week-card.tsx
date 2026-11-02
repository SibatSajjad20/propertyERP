"use client";

import * as React from "react";
import { CalendarDots, ArrowRight } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPkr, formatPkrCompact } from "@/lib/money";
import type { DueThisWeekSummary } from "../queries";

export interface DueThisWeekCardProps {
  summary: DueThisWeekSummary;
  onSelectBooking?: (bookingId: string) => void;
}

export function DueThisWeekCard({ summary, onSelectBooking }: DueThisWeekCardProps) {
  return (
    <div className="card flex flex-col gap-4 rounded-[12px] p-4">
      {/* Top Banner & Stats */}
      <div className="flex flex-col gap-3 border-b border-line pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
            <CalendarDots weight="bold" className="size-4" />
          </div>
          <div>
            <h3 className="text-[14px] font-semibold text-ink">
              Due This Week &amp; Overdue Installments
            </h3>
            <p className="text-[11px] text-ink-muted">
              Upcoming installments due within 7 days and overdue accounts needing
              follow-up
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-[8px] bg-subtle px-3 py-1.5 text-right">
            <span className="text-[10px] font-medium text-ink-muted uppercase">
              Due This Week
            </span>
            <p className="font-sans text-[13px] font-semibold text-ink tabular-nums">
              {summary.dueThisWeekCount} ({formatPkrCompact(summary.dueThisWeekPkr)})
            </p>
          </div>
          {summary.overdueCount > 0 && (
            <div className="rounded-[8px] border border-sold/20 bg-sold/10 px-3 py-1.5 text-right">
              <span className="text-[10px] font-medium text-sold uppercase">Overdue</span>
              <p className="font-sans text-[13px] font-semibold text-sold tabular-nums">
                {summary.overdueCount} ({formatPkrCompact(summary.overduePkr)})
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Rows Table */}
      {summary.rows.length === 0 ? (
        <div className="py-6 text-center text-[12px] text-ink-muted">
          No installments due this week or overdue. All schedules are up to date.
        </div>
      ) : (
        <div className="max-h-72 overflow-x-auto overflow-y-auto">
          <table className="w-full text-left font-sans text-[12px]">
            <thead className="sticky top-0 border-b border-line bg-subtle/60 bg-surface text-[11px] font-medium tracking-wider text-ink-muted uppercase">
              <tr>
                <th className="px-3 py-2">Client</th>
                <th className="px-3 py-2">Unit</th>
                <th className="px-3 py-2">Booking #</th>
                <th className="px-2 py-2 text-center">Seq</th>
                <th className="px-3 py-2">Due Date</th>
                <th className="px-3 py-2 text-right">Balance Due</th>
                <th className="px-3 py-2 text-center">Status</th>
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {summary.rows.map((row) => (
                <tr
                  key={row.installmentId}
                  className="transition-colors hover:bg-subtle/30"
                >
                  <td className="px-3 py-2 font-medium text-ink">
                    <div>{row.clientName}</div>
                    <div className="font-mono text-[10px] text-ink-muted">
                      {row.clientCnic}
                    </div>
                  </td>
                  <td className="px-3 py-2 font-mono text-[11px] text-ink">
                    {row.unitCode}
                  </td>
                  <td className="px-3 py-2 font-mono text-[11px] text-primary">
                    {row.bookingNo}
                  </td>
                  <td className="px-2 py-2 text-center font-sans text-ink-muted tabular-nums">
                    #{row.seq}
                  </td>
                  <td className="px-3 py-2 tabular-nums">
                    <span
                      className={row.isOverdue ? "font-medium text-sold" : "text-ink"}
                    >
                      {new Date(row.dueDate).toISOString().split("T")[0]}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-ink tabular-nums">
                    {formatPkr(row.balance)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <Badge tone={row.isOverdue ? "sold" : "accent"}>
                      {row.isOverdue ? "OVERDUE" : "DUE"}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onSelectBooking?.(row.bookingId)}
                      className="h-7 gap-1 px-2 text-[11px]"
                    >
                      <span>Manage</span>
                      <ArrowRight weight="bold" className="size-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
