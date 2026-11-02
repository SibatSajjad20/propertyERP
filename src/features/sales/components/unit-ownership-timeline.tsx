/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { formatPkr } from "@/lib/money";
import type { UnitTimelineEvent } from "../queries";

interface UnitOwnershipTimelineProps {
  events: UnitTimelineEvent[];
}

export function UnitOwnershipTimeline({ events }: UnitOwnershipTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="py-4 text-[13px] text-ink-muted">
        No sales or ownership transactions recorded yet.
      </div>
    );
  }

  return (
    <div className="relative space-y-4 pl-4 before:absolute before:top-2 before:bottom-2 before:left-[7px] before:w-0.5 before:bg-line">
      {events.map((event) => (
        <div key={event.id} className="relative flex items-start gap-3 text-[13px]">
          {/* Timeline Dot */}
          <span className="relative z-10 mt-1 size-2 rounded-full bg-primary ring-4 ring-surface" />

          {/* Event Content */}
          <div className="flex-1 space-y-1 rounded-[8px] border border-line bg-surface p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-ink">{event.title}</span>
              <span className="font-sans text-[11px] text-ink-muted tabular-nums">
                {new Date(event.date).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-[12px]">
              {event.amountPkr && (
                <span className="font-semibold text-ink tabular-nums">
                  {formatPkr(event.amountPkr)}
                </span>
              )}
              {event.actorName && (
                <span className="text-[11px] text-ink-muted">By: {event.actorName}</span>
              )}
            </div>

            {event.details && (
              <div className="mt-1 text-[11px] text-ink-muted">
                {Boolean((event.details as { reason?: string })?.reason) && (
                  <p className="italic">
                    &ldquo;{String((event.details as { reason?: string }).reason)}&rdquo;
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
