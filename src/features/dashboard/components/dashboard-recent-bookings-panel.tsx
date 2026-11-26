"use client";

import * as React from "react";
import Link from "next/link";
import { Panel } from "@/components/ui/panel";
import { formatPkrCompact } from "@/lib/money";
import type { RecentBookingItem } from "../queries";

export interface DashboardRecentBookingsPanelProps {
  bookings: RecentBookingItem[];
  className?: string;
}

export function DashboardRecentBookingsPanel({
  bookings,
  className,
}: DashboardRecentBookingsPanelProps) {
  const items = bookings.slice(0, 5);

  return (
    <Panel
      title="Recent bookings"
      actions={
        <Link
          href="/bookings"
          className="text-[12.5px] font-medium text-primary transition-colors hover:text-primary-hover"
        >
          All bookings
        </Link>
      }
      className={className}
      bodyClassName="p-5 flex flex-col justify-between"
    >
      {items.length === 0 ? (
        <div className="py-8 text-center text-[12.5px] text-muted">
          No bookings recorded yet.
        </div>
      ) : (
        <ul className="divide-y divide-line/60">
          {items.map((item) => {
            const net = Number(item.netPrice) || 1;
            const paid = Number(item.paidTotal) || 0;
            const paidPct = Math.min(100, Math.round((paid / net) * 100));

            return (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 py-2.5 first:pt-1 last:pb-1"
              >
                {/* Booking No and Client */}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-sans text-[12.5px] leading-snug font-medium text-primary">
                    {item.bookingNo}
                  </p>
                  <p className="mt-0.5 truncate text-[11.5px] text-muted">
                    {item.clientName}
                  </p>
                </div>

                {/* Unit Code */}
                <div className="shrink-0 px-2 text-center">
                  <span className="font-sans text-[12.5px] font-medium text-ink">
                    {item.unitCode}
                  </span>
                </div>

                {/* Net Price & Paid % */}
                <div className="shrink-0 text-right">
                  <p className="text-[12.5px] leading-snug font-semibold text-ink tabular-nums">
                    {formatPkrCompact(item.netPrice)}
                  </p>
                  <p className="mt-0.5">
                    <span className="inline-block rounded bg-[#F2F4F7] px-1.5 py-0.5 text-[10.5px] font-medium text-ink tabular-nums">
                      {paidPct}% paid
                    </span>
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
