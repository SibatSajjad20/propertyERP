"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Eye, EyeSlash } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { formatPkrCompact } from "@/lib/money";
import type { FloorLedgerRow } from "../queries";

interface FloorStackProps {
  floors: FloorLedgerRow[];
}

export function FloorStack({ floors }: FloorStackProps) {
  const [showEmptyBasements, setShowEmptyBasements] = React.useState(false);

  // Sort floors top floor first (highest level at the top, Ground at 0, Basements negative)
  const sortedFloors = React.useMemo(() => {
    return [...floors].sort((a, b) => b.level - a.level);
  }, [floors]);

  const emptyBasementsCount = React.useMemo(() => {
    return sortedFloors.filter((f) => f.level < 0 && f.total === 0).length;
  }, [sortedFloors]);

  const visibleFloors = React.useMemo(() => {
    if (showEmptyBasements) return sortedFloors;
    return sortedFloors.filter((f) => !(f.level < 0 && f.total === 0));
  }, [sortedFloors, showEmptyBasements]);

  if (floors.length === 0) {
    return (
      <div className="flex h-48 w-full items-center justify-center text-[12px] text-ink-muted">
        No floors registered in this property.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col justify-between">
      {/* Optional toggle header if empty basements exist */}
      {emptyBasementsCount > 0 && (
        <div className="mb-2 flex items-center justify-between text-[11px] text-ink-muted">
          <span>
            {visibleFloors.length} floor{visibleFloors.length === 1 ? "" : "s"} shown
          </span>
          <button
            type="button"
            onClick={() => setShowEmptyBasements((prev) => !prev)}
            className="flex cursor-pointer items-center gap-1.5 rounded-[6px] border border-line bg-surface px-2 py-0.5 text-[11px] font-medium text-ink transition-colors hover:bg-subtle"
          >
            {showEmptyBasements ? (
              <>
                <EyeSlash weight="light" className="size-3 text-ink-muted" />
                Hide empty basements ({emptyBasementsCount})
              </>
            ) : (
              <>
                <Eye weight="light" className="size-3 text-ink-muted" />
                Show empty basements ({emptyBasementsCount})
              </>
            )}
          </button>
        </div>
      )}

      {/* Building Stack Rows */}
      <div className="space-y-2 overflow-y-auto pr-1">
        {visibleFloors.map((floor, index) => {
          const availPct = floor.total > 0 ? (floor.available / floor.total) * 100 : 0;
          const resPct = floor.total > 0 ? (floor.reserved / floor.total) * 100 : 0;
          const bkPct = floor.total > 0 ? (floor.booked / floor.total) * 100 : 0;
          const soldPct = floor.total > 0 ? (floor.sold / floor.total) * 100 : 0;
          const isGround = floor.level === 0;
          const isBasement = floor.level < 0;

          const label = floor.floorLabel ?? floor.floorName;
          const tooltip = `${label}: ${floor.sold} sold (${formatPkrCompact(floor.soldValuePkr)}), ${floor.booked} booked (${formatPkrCompact(floor.bookedValuePkr)}), ${floor.reserved} reserved (${formatPkrCompact(floor.reservedValuePkr)}), ${floor.available} available (${formatPkrCompact(floor.availableValuePkr)}) · Total: ${formatPkrCompact(floor.totalValuePkr)}`;

          return (
            <Link
              key={floor.floorId}
              href={`/inventory?floorId=${floor.floorId}`}
              className="group relative flex items-center gap-3 rounded-[6px] border border-transparent p-1.5 transition-colors hover:border-line hover:bg-subtle/50"
              title={tooltip}
            >
              {/* Floor Label (no L-number) */}
              <div className="flex w-24 shrink-0 items-center font-sans text-[12px]">
                <span
                  className={`truncate font-semibold ${
                    isGround
                      ? "font-bold text-primary"
                      : isBasement
                        ? "text-ink-muted"
                        : "text-ink"
                  }`}
                >
                  {label}
                </span>
              </div>

              {/* 8px rounded segmented bar: Available at 18% opacity, others solid */}
              <div className="relative flex h-5 flex-1 overflow-hidden rounded-[8px] bg-line/40">
                {floor.total > 0 ? (
                  <>
                    {/* Available Segment: #1F7A4D at 18% opacity */}
                    {availPct > 0 && (
                      <motion.div
                        className="h-full transition-opacity group-hover:opacity-90"
                        style={{ backgroundColor: "rgba(31, 122, 77, 0.18)" }}
                        initial={{ width: 0 }}
                        animate={{ width: `${availPct}%` }}
                        transition={{
                          duration: 0.45,
                          delay: index * 0.03,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                      />
                    )}
                    {/* Reserved Segment: Solid #B7791F */}
                    {resPct > 0 && (
                      <motion.div
                        className="h-full transition-opacity group-hover:opacity-90"
                        style={{ backgroundColor: "#B7791F" }}
                        initial={{ width: 0 }}
                        animate={{ width: `${resPct}%` }}
                        transition={{
                          duration: 0.45,
                          delay: index * 0.03,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                      />
                    )}
                    {/* Booked Segment: Solid #0B558B */}
                    {bkPct > 0 && (
                      <motion.div
                        className="h-full transition-opacity group-hover:opacity-90"
                        style={{ backgroundColor: "#0B558B" }}
                        initial={{ width: 0 }}
                        animate={{ width: `${bkPct}%` }}
                        transition={{
                          duration: 0.45,
                          delay: index * 0.03,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                      />
                    )}
                    {/* Sold Segment: Solid #9B2C2C */}
                    {soldPct > 0 && (
                      <motion.div
                        className="h-full transition-opacity group-hover:opacity-90"
                        style={{ backgroundColor: "#9B2C2C" }}
                        initial={{ width: 0 }}
                        animate={{ width: `${soldPct}%` }}
                        transition={{
                          duration: 0.45,
                          delay: index * 0.03,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                      />
                    )}
                  </>
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] text-ink-muted">
                    No units
                  </div>
                )}
              </div>

              {/* Right Stats: "x% sold" + small booked/reserved counts */}
              <div className="flex w-36 shrink-0 items-center justify-end gap-2 text-right font-sans text-[11px] tabular-nums">
                {floor.total > 0 ? (
                  <div className="flex items-baseline gap-1.5 truncate">
                    <span className="font-semibold text-ink">
                      {floor.soldPercent.toFixed(0)}% sold
                    </span>
                    <span className="text-[10px] text-ink-muted">
                      ({floor.booked} bk · {floor.reserved} res)
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] text-ink-muted">0 units</span>
                )}
                <ArrowRight
                  weight="light"
                  className="size-3 shrink-0 text-ink-muted opacity-0 transition-opacity group-hover:opacity-100"
                />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Stack Legend */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line/60 pt-2 text-[11px] text-ink-muted">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span
              className="size-2 rounded-full border border-available"
              style={{ backgroundColor: "rgba(31, 122, 77, 0.18)" }}
              aria-hidden="true"
            />
            <span>Available (18%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: "#B7791F" }}
              aria-hidden="true"
            />
            <span>Reserved</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: "#0B558B" }}
              aria-hidden="true"
            />
            <span>Booked</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: "#9B2C2C" }}
              aria-hidden="true"
            />
            <span>Sold</span>
          </div>
        </div>
        <span className="text-[10px]">Click floor to filter inventory</span>
      </div>
    </div>
  );
}
