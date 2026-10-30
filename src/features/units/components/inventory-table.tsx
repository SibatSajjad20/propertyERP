"use client";

import { createColumnHelper, tableFeatures, useTable } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";
import { cn } from "@/lib/cn";
import { formatPkrLedger } from "@/lib/money";
import type { InventoryQuery, InventorySortField } from "../schema";
import type { InventoryRow, InventoryTotals } from "../types";

export const inventoryTableFeatures = tableFeatures({});

const helper = createColumnHelper<typeof inventoryTableFeatures, InventoryRow>();

const numericAccessors = new Set([
  "netAreaSqft",
  "grossAreaSqft",
  "ratePerSqftPkr",
  "bookPricePkr",
]);

function StatusCell({ status }: { status: InventoryRow["status"] }) {
  const sold = status === "SOLD";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn("size-1.5 rounded-full", sold ? "bg-sold" : "bg-available")}
        aria-hidden="true"
      />
      <span className={sold ? "text-sold" : "text-available"}>
        {sold ? "Sold" : "Available"}
      </span>
    </span>
  );
}

export const inventoryColumns = helper.columns([
  helper.accessor("unitCode", {
    header: "Unit code",
    cell: (info) => info.getValue(),
  }),
  helper.accessor("unitNumber", {
    header: "Unit no.",
    cell: (info) => info.getValue(),
  }),
  helper.accessor("floorName", {
    header: "Floor",
    cell: (info) => info.getValue(),
  }),
  helper.accessor("categoryName", {
    header: "Category",
    cell: (info) => info.getValue(),
  }),
  helper.accessor("netAreaSqft", {
    header: "Net sq ft",
    cell: (info) => info.getValue(),
  }),
  helper.accessor("grossAreaSqft", {
    header: "Gross sq ft",
    cell: (info) => info.getValue() ?? "—",
  }),
  helper.accessor("ratePerSqftPkr", {
    header: "Rate/sq ft",
    cell: (info) => formatPkrLedger(info.getValue()),
  }),
  helper.accessor("bookPricePkr", {
    header: "Total price",
    cell: (info) => formatPkrLedger(info.getValue()),
  }),
  helper.accessor("status", {
    header: "Status",
    cell: (info) => <StatusCell status={info.getValue()} />,
  }),
  helper.accessor("ownershipGroup", {
    header: "Ownership group",
    cell: (info) => info.getValue() ?? "—",
  }),
]);

const sortByColumn: Record<string, InventorySortField> = {
  unitCode: "unitCode",
  unitNumber: "unitNumber",
  floorName: "floor",
  categoryName: "category",
  netAreaSqft: "netAreaSqft",
  grossAreaSqft: "grossAreaSqft",
  ratePerSqftPkr: "ratePerSqftPkr",
  bookPricePkr: "totalPrice",
  status: "status",
  ownershipGroup: "ownershipGroup",
};

type InventoryTableProps = {
  data: InventoryRow[];
  totals: InventoryTotals;
  query: InventoryQuery;
  selectedId?: string;
  onRowClick: (row: InventoryRow) => void;
  onSort: (field: InventorySortField) => void;
  emptyMessage: string;
};

export function InventoryTable({
  data,
  totals,
  query,
  selectedId,
  onRowClick,
  onSort,
  emptyMessage,
}: InventoryTableProps) {
  const table = useTable({
    features: inventoryTableFeatures,
    columns: inventoryColumns,
    data,
  });
  const parentRef = useRef<HTMLDivElement>(null);
  const rows = table.getRowModel().rows;
  // eslint-disable-next-line react-hooks/incompatible-library -- required virtualizer API
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32,
    overscan: 12,
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={parentRef} className="min-h-0 flex-1 overflow-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead className="sticky top-0 bg-bg">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id} className="border-b border-line">
                {group.headers.map((header) => {
                  const numeric = numericAccessors.has(header.column.id);
                  const sortField = sortByColumn[header.column.id];
                  const active = sortField === query.sort;
                  return (
                    <th
                      key={header.id}
                      className={cn(
                        "h-8 px-2 text-left text-[11px] font-medium tracking-wide text-ink-muted",
                        numeric && "text-right",
                      )}
                    >
                      {header.isPlaceholder || !sortField ? null : (
                        <button
                          type="button"
                          className={cn(
                            "inline-flex h-8 items-center gap-1",
                            numeric && "w-full justify-end",
                            active && "text-ink",
                          )}
                          onClick={() => onSort(sortField)}
                        >
                          <table.FlexRender header={header} />
                          {active ? (
                            <span className="text-[10px]">
                              {query.dir === "desc" ? "desc" : "asc"}
                            </span>
                          ) : null}
                        </button>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={inventoryColumns.length}
                  className="h-24 px-2 text-center text-ink-muted"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              <>
                {virtualizer.getVirtualItems().length > 0 ? (
                  <tr aria-hidden="true">
                    <td
                      colSpan={inventoryColumns.length}
                      style={{ height: virtualizer.getVirtualItems()[0]?.start ?? 0 }}
                      className="p-0"
                    />
                  </tr>
                ) : null}
                {virtualizer.getVirtualItems().map((virtualRow) => {
                  const row = rows[virtualRow.index];
                  if (!row) {
                    return null;
                  }
                  const selected = row.original.id === selectedId;
                  return (
                    <tr
                      key={row.id}
                      tabIndex={0}
                      aria-selected={selected}
                      className={cn(
                        "h-8 cursor-pointer border-b border-line transition-colors duration-[var(--duration-fast)] ease-[var(--ease-ledger)]",
                        selected ? "bg-surface" : "hover:bg-surface",
                      )}
                      onClick={() => onRowClick(row.original)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onRowClick(row.original);
                        }
                      }}
                    >
                      {row.getAllCells().map((cell) => {
                        const numeric = numericAccessors.has(cell.column.id);
                        const isCode = cell.column.id === "unitCode";
                        return (
                          <td
                            key={cell.id}
                            className={cn(
                              "h-8 px-2 align-middle",
                              numeric && "text-right tabular-nums",
                              isCode && "unit-code",
                            )}
                          >
                            <table.FlexRender cell={cell} />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </>
            )}
          </tbody>
          <tfoot className="sticky bottom-0 bg-bg">
            <tr className="border-t border-line">
              <td className="h-8 px-2 text-[12px] text-ink-muted" colSpan={4}>
                {totals.count === 1 ? "1 unit" : `${totals.count} units`}
              </td>
              <td className="h-8 px-2 text-right text-[12px] text-ink tabular-nums">
                {totals.netAreaSqft}
              </td>
              <td colSpan={2} />
              <td className="h-8 px-2 text-right text-[12px] text-ink tabular-nums">
                {formatPkrLedger(totals.valuePkr)}
              </td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
