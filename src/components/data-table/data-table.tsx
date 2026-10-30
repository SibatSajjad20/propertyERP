"use client";

import { createColumnHelper, tableFeatures, useTable } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";
import { cn } from "@/lib/cn";

export const inventoryTableFeatures = tableFeatures({});

export type InventoryRow = {
  id: string;
  unitCode: string;
  unitNumber: string;
  floorName: string;
  categoryName: string;
  netAreaSqft: string;
  grossAreaSqft: string | null;
  ratePerSqftPkr: string;
  bookPricePkr: string;
  status: "AVAILABLE" | "SOLD";
  ownershipGroup: string | null;
};

const helper = createColumnHelper<typeof inventoryTableFeatures, InventoryRow>();

export const inventoryColumns = helper.columns([
  helper.accessor("unitCode", { header: "Unit code", cell: (info) => info.getValue() }),
  helper.accessor("unitNumber", { header: "Unit no.", cell: (info) => info.getValue() }),
  helper.accessor("floorName", { header: "Floor", cell: (info) => info.getValue() }),
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
    cell: (info) => info.getValue(),
  }),
  helper.accessor("bookPricePkr", {
    header: "Total price",
    cell: (info) => info.getValue(),
  }),
  helper.accessor("status", { header: "Status", cell: (info) => info.getValue() }),
  helper.accessor("ownershipGroup", {
    header: "Ownership group",
    cell: (info) => info.getValue() ?? "—",
  }),
]);

const numericAccessors = new Set([
  "netAreaSqft",
  "grossAreaSqft",
  "ratePerSqftPkr",
  "bookPricePkr",
]);

type DataTableProps = {
  data: InventoryRow[];
  onRowClick?: (row: InventoryRow) => void;
  emptyMessage?: string;
};

export function DataTable({
  data,
  onRowClick,
  emptyMessage = "No units on the ledger yet.",
}: DataTableProps) {
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
                  return (
                    <th
                      key={header.id}
                      className={cn(
                        "h-8 px-2 text-left text-[11px] font-medium tracking-wide text-ink-muted",
                        numeric && "text-right",
                      )}
                    >
                      {header.isPlaceholder ? null : <table.FlexRender header={header} />}
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
                  return (
                    <tr
                      key={row.id}
                      className="h-8 border-b border-line transition-colors duration-[var(--duration-fast)] ease-[var(--ease-ledger)] hover:bg-surface"
                      onClick={() => onRowClick?.(row.original)}
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
        </table>
      </div>
    </div>
  );
}
