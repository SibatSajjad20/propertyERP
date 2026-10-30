"use client";

import * as React from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  CheckCircle,
  WarningCircle,
  XCircle,
  DownloadSimple,
  ArrowCounterClockwise,
  UploadSimple,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPkr } from "@/lib/money";
import type { ImportMode, ValidatedImportRow } from "../types";

interface ImportPreviewTableProps {
  fileName: string;
  mode: ImportMode;
  rows: ValidatedImportRow[];
  headers: string[];
  onCommit: () => void;
  onRemap: () => void;
  onDownloadErrors: () => void;
  committing: boolean;
}

type FilterTab = "ALL" | "VALID" | "WARNING" | "ERROR";

export function ImportPreviewTable({
  fileName,
  mode,
  rows,
  onCommit,
  onRemap,
  onDownloadErrors,
  committing,
}: ImportPreviewTableProps) {
  const [filter, setFilter] = React.useState<FilterTab>("ALL");

  const validCount = rows.filter((r) => r.status === "VALID").length;
  const warningCount = rows.filter((r) => r.status === "WARNING").length;
  const errorCount = rows.filter((r) => r.status === "ERROR").length;

  const filteredRows = React.useMemo(() => {
    if (filter === "VALID") return rows.filter((r) => r.status === "VALID");
    if (filter === "WARNING") return rows.filter((r) => r.status === "WARNING");
    if (filter === "ERROR") return rows.filter((r) => r.status === "ERROR");
    return rows;
  }, [rows, filter]);

  const parentRef = React.useRef<HTMLDivElement>(null);

  // eslint-disable-next-line react-hooks/incompatible-library -- required virtualizer API
  const rowVirtualizer = useVirtualizer({
    count: filteredRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44,
    overscan: 12,
  });

  const canCommit = (validCount > 0 || warningCount > 0) && errorCount === 0;

  return (
    <div className="space-y-4">
      {/* Top summary & controls */}
      <div className="flex flex-col gap-4 rounded-[8px] border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-[11px] font-medium tracking-wider text-ink-muted uppercase">
              File & Mode
            </span>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="font-mono text-[13px] font-medium text-ink">
                {fileName}
              </span>
              <span className="text-[12px] text-ink-muted">
                ({mode === "CREATE_ONLY" ? "Create new only" : "Create + update existing"}
                )
              </span>
            </div>
          </div>

          <div className="h-8 w-px bg-line" />

          {/* Counts */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setFilter("ALL")}
              className={`flex items-center gap-1.5 rounded-[4px] border px-2.5 py-1 text-[12px] font-medium transition-colors ${
                filter === "ALL"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-line bg-surface text-ink hover:bg-subtle"
              }`}
            >
              <span>All</span>
              <span className="font-mono text-[11px] text-ink-muted tabular-nums">
                {rows.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilter("VALID")}
              className={`flex items-center gap-1.5 rounded-[4px] border px-2.5 py-1 text-[12px] font-medium transition-colors ${
                filter === "VALID"
                  ? "border-available bg-[color-mix(in_srgb,var(--available)_10%,transparent)] text-available"
                  : "border-line bg-surface text-ink hover:bg-subtle"
              }`}
            >
              <CheckCircle weight="fill" className="size-3 text-available" />
              <span>Valid</span>
              <span className="font-mono text-[11px] text-available tabular-nums">
                {validCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilter("WARNING")}
              className={`flex items-center gap-1.5 rounded-[4px] border px-2.5 py-1 text-[12px] font-medium transition-colors ${
                filter === "WARNING"
                  ? "border-accent bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-accent"
                  : "border-line bg-surface text-ink hover:bg-subtle"
              }`}
            >
              <WarningCircle weight="fill" className="size-3 text-accent" />
              <span>Warnings</span>
              <span className="font-mono text-[11px] text-accent tabular-nums">
                {warningCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilter("ERROR")}
              className={`flex items-center gap-1.5 rounded-[4px] border px-2.5 py-1 text-[12px] font-medium transition-colors ${
                filter === "ERROR"
                  ? "border-sold bg-[color-mix(in_srgb,var(--sold)_10%,transparent)] text-sold"
                  : "border-line bg-surface text-ink hover:bg-subtle"
              }`}
            >
              <XCircle weight="fill" className="size-3 text-sold" />
              <span>Errors</span>
              <span className="font-mono text-[11px] text-sold tabular-nums">
                {errorCount}
              </span>
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5">
          {errorCount > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<DownloadSimple weight="light" className="size-4 text-sold" />}
              onClick={onDownloadErrors}
            >
              Download error rows (.xlsx)
            </Button>
          )}

          <Button
            type="button"
            variant="secondary"
            size="sm"
            leftIcon={<ArrowCounterClockwise weight="light" className="size-4" />}
            onClick={onRemap}
            disabled={committing}
          >
            Re-map columns
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            loading={committing}
            disabled={!canCommit || committing}
            leftIcon={<UploadSimple weight="light" className="size-4" />}
            onClick={onCommit}
          >
            Commit {validCount + warningCount} units
          </Button>
        </div>
      </div>

      {/* Virtualized Table Container */}
      <div className="overflow-hidden rounded-[8px] border border-line bg-surface">
        {/* Sticky Table Header */}
        <div className="grid grid-cols-12 gap-2 border-b border-line-strong bg-subtle/50 px-4 py-2.5 text-[11px] font-medium tracking-wider text-ink-muted uppercase select-none">
          <div className="col-span-1">Row</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-3">Validation Issues</div>
          <div className="col-span-1">Code</div>
          <div className="col-span-1">Floor</div>
          <div className="col-span-1">Category</div>
          <div className="col-span-1 text-right">Net Area</div>
          <div className="col-span-1 text-right">Rate</div>
          <div className="col-span-1">Availability</div>
          <div className="col-span-1">Buyer / Notes</div>
        </div>

        {/* Virtualized Rows Viewport */}
        <div
          ref={parentRef}
          className="relative h-[460px] divide-y divide-line overflow-auto"
        >
          {filteredRows.length === 0 ? (
            <div className="flex h-full items-center justify-center text-[13px] text-ink-muted">
              No rows match the selected filter ({filter.toLowerCase()}).
            </div>
          ) : (
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const item = filteredRows[virtualRow.index];
                if (!item) return null;
                const c = item.cleaned;

                return (
                  <div
                    key={item.rowIndex}
                    data-index={virtualRow.index}
                    ref={rowVirtualizer.measureElement}
                    className={`absolute top-0 left-0 grid w-full grid-cols-12 items-center gap-2 border-b border-line px-4 py-2 text-[12px] transition-colors hover:bg-subtle/30 ${
                      item.status === "ERROR"
                        ? "bg-[color-mix(in_srgb,var(--sold)_3%,transparent)]"
                        : item.status === "WARNING"
                          ? "bg-[color-mix(in_srgb,var(--accent)_3%,transparent)]"
                          : ""
                    }`}
                    style={{
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {/* Row index */}
                    <div className="col-span-1 font-mono text-[11px] text-ink-muted tabular-nums">
                      #{item.rowIndex + 1}
                    </div>

                    {/* Status badge */}
                    <div className="col-span-1">
                      {item.status === "VALID" && (
                        <Badge tone="available" showDot={true}>
                          Valid
                        </Badge>
                      )}
                      {item.status === "WARNING" && (
                        <Badge tone="accent" showDot={true}>
                          Warning
                        </Badge>
                      )}
                      {item.status === "ERROR" && (
                        <Badge tone="sold" showDot={true}>
                          Error
                        </Badge>
                      )}
                    </div>

                    {/* Inline Reasons */}
                    <div className="col-span-3 truncate text-[11px] leading-tight">
                      {item.errors.length > 0 ? (
                        <span
                          className="font-medium text-sold"
                          title={item.errors.join("; ")}
                        >
                          {item.errors[0]}
                          {item.errors.length > 1 && ` (+${item.errors.length - 1} more)`}
                        </span>
                      ) : item.warnings.length > 0 ? (
                        <span className="text-accent" title={item.warnings.join("; ")}>
                          {item.warnings[0]}
                        </span>
                      ) : (
                        <span className="text-available">All invariants satisfied</span>
                      )}
                    </div>

                    {/* Unit Code */}
                    <div className="col-span-1 truncate font-mono font-medium text-ink">
                      {c?.unitCode || "-"}
                    </div>

                    {/* Floor & Block */}
                    <div className="col-span-1 truncate text-ink-muted">
                      {c?.floorName || "-"}
                    </div>

                    {/* Category */}
                    <div className="col-span-1 truncate text-ink-muted">
                      {c?.categoryName || "-"}
                    </div>

                    {/* Net Area */}
                    <div className="col-span-1 text-right font-mono text-ink tabular-nums">
                      {c?.netAreaSqft ? `${c.netAreaSqft} sqft` : "-"}
                    </div>

                    {/* Rate */}
                    <div className="col-span-1 text-right font-mono text-ink tabular-nums">
                      {c?.ratePerSqftPkr ? formatPkr(c.ratePerSqftPkr) : "-"}
                    </div>

                    {/* Availability Status */}
                    <div className="col-span-1">
                      <Badge
                        tone={c?.status === "SOLD" ? "sold" : "available"}
                        showDot={true}
                      >
                        {c?.status === "SOLD" ? "Sold" : "Available"}
                      </Badge>
                    </div>

                    {/* Buyer / Notes */}
                    <div
                      className="col-span-1 truncate text-[11px] text-ink-muted"
                      title={c?.notes ?? c?.buyer ?? ""}
                    >
                      {c?.buyer ? `${c.buyer}` : c?.notes ? `${c.notes}` : "-"}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Summary Bar */}
        <div className="flex items-center justify-between border-t border-line-strong bg-subtle/40 px-5 py-2.5 text-[12px] text-ink-muted">
          <div>
            Showing{" "}
            <span className="font-mono text-ink tabular-nums">{filteredRows.length}</span>{" "}
            of <span className="font-mono text-ink tabular-nums">{rows.length}</span> rows
          </div>
          <div>
            {errorCount > 0 ? (
              <span className="font-medium text-sold">
                {errorCount} rows must be corrected before committing.
              </span>
            ) : (
              <span className="font-medium text-available">
                Ready to commit {validCount + warningCount} units into database ledger.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
