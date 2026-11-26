"use client";

import * as React from "react";
import Link from "next/link";
import { Panel } from "@/components/ui/panel";
import type { FloorLedgerRow } from "../queries";

export interface FloorAvailabilityPanelProps {
  floors: FloorLedgerRow[];
  className?: string;
}

export function FloorAvailabilityPanel({
  floors,
  className,
}: FloorAvailabilityPanelProps) {
  // Sort top floor first (level desc)
  const sortedFloors = React.useMemo(() => {
    return [...floors].sort((a, b) => b.level - a.level);
  }, [floors]);

  // Aggregate totals for the legend
  const totals = React.useMemo(() => {
    let sold = 0;
    let booked = 0;
    let reserved = 0;
    let available = 0;
    let total = 0;

    for (const f of floors) {
      sold += f.sold;
      booked += f.booked;
      reserved += f.reserved;
      available += f.available;
      total += f.total;
    }

    return { sold, booked, reserved, available, total };
  }, [floors]);

  return (
    <Panel
      title="Availability by floor"
      actions={
        <Link
          href="/structure"
          className="text-[12.5px] font-medium text-primary transition-colors hover:text-primary-hover"
        >
          Structure
        </Link>
      }
      className={className}
      bodyClassName="p-5 flex flex-col justify-between h-[calc(100%-50px)]"
    >
      <div className="max-h-[175px] space-y-3.5 overflow-y-auto pr-1">
        {sortedFloors.map((floor) => {
          const total = floor.total || 1;
          const soldPct = (floor.sold / total) * 100;
          const bookedPct = (floor.booked / total) * 100;
          const resPct = (floor.reserved / total) * 100;
          const availPct = (floor.available / total) * 100;

          // Short code e.g. "4F", "3F", "GF"
          const code =
            floor.floorName.length > 5 ? floor.floorName.slice(0, 4) : floor.floorName;

          return (
            <div key={floor.floorId} className="flex items-center gap-3 text-[12.5px]">
              <span className="w-9 shrink-0 truncate text-left font-medium text-ink">
                {code}
              </span>

              {/* 10px stacked bar with 2px gap */}
              <div className="flex h-2.5 flex-1 gap-[2px] overflow-hidden rounded-[2px] bg-[#EDEFF2]">
                {soldPct > 0 && (
                  <div
                    className="h-full bg-[#0B3F66] transition-all"
                    style={{ width: `${soldPct}%` }}
                    title={`Sold: ${floor.sold}`}
                  />
                )}
                {bookedPct > 0 && (
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${bookedPct}%` }}
                    title={`Booked: ${floor.booked}`}
                  />
                )}
                {resPct > 0 && (
                  <div
                    className="h-full bg-[#7FA6C6] transition-all"
                    style={{ width: `${resPct}%` }}
                    title={`Reserved: ${floor.reserved}`}
                  />
                )}
                {availPct > 0 && (
                  <div
                    className="h-full bg-[#E3E9EF] transition-all"
                    style={{ width: `${availPct}%` }}
                    title={`Available: ${floor.available}`}
                  />
                )}
              </div>

              <span className="w-16 shrink-0 text-right text-[12px] text-muted tabular-nums">
                <span className="font-medium text-ink">{floor.available}</span>
                <span className="text-subtle"> / </span>
                <span>{floor.total}</span>
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend with real totals */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4 text-[11.5px] text-muted">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-[2px] bg-[#0B3F66]" aria-hidden="true" />
          <span>Sold ({totals.sold})</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-[2px] bg-primary" aria-hidden="true" />
          <span>Booked ({totals.booked})</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-[2px] bg-[#7FA6C6]" aria-hidden="true" />
          <span>Reserved ({totals.reserved})</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-[2px] bg-[#E3E9EF]" aria-hidden="true" />
          <span>Available ({totals.available})</span>
        </span>
      </div>
    </Panel>
  );
}
