"use client";

import { createColumnHelper, tableFeatures, useTable } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";

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
  status: "AVAILABLE" | "SOLD" | "RESERVED" | "BOOKED";
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

export interface DataTablePaginationProps {
  pageIndex?: number;
  pageSize?: number;
  totalCount?: number;
  onPreviousPage?: () => void;
  onNextPage?: () => void;
  canPreviousPage?: boolean;
  canNextPage?: boolean;
}

export type DataTableProps = {
  data: InventoryRow[];
  onRowClick?: (row: InventoryRow) => void;
  emptyMessage?: string;
  toolbar?: React.ReactNode;
  pagination?: DataTablePaginationProps;
  className?: string;
};

export function DataTable({
  data,
  onRowClick,
  emptyMessage = "No units on the ledger yet.",
  toolbar,
  pagination,
  className,
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
    estimateSize: () => 44,
    overscan: 12,
  });

  const total = pagination?.totalCount ?? rows.length;
  const pageIdx = pagination?.pageIndex ?? 0;
  const size = pagination?.pageSize ?? rows.length;
  const startRow = total === 0 ? 0 : pageIdx * size + 1;
  const endRow = Math.min(total, (pageIdx + 1) * size);

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden rounded-[12px] border border-border bg-surface shadow-[0_1px_2px_rgba(15,23,42,0.03)]",
        className,
      )}
    >
      {toolbar && (
        <div className="flex items-center gap-2 border-b border-line bg-surface px-4 py-3">
          {toolbar}
        </div>
      )}

      <div ref={parentRef} className="min-h-0 flex-1 overflow-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead className="sticky top-0 z-10 bg-sidebar-bg">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id} className="border-b border-line">
                {group.headers.map((header) => {
                  const numeric = numericAccessors.has(header.column.id);
                  return (
                    <th
                      key={header.id}
                      className={cn(
                        "h-[38px] border-b border-line bg-sidebar-bg px-4 text-left text-[12px] font-medium whitespace-nowrap text-muted",
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
                  className="h-24 px-4 text-center text-[13px] text-muted"
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
                      className="border-0 p-0"
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
                      className="h-[44px] cursor-pointer border-b border-line transition-colors duration-[var(--duration-hover)] hover:bg-[#FAFBFC]"
                      onClick={() => onRowClick?.(row.original)}
                    >
                      {row.getAllCells().map((cell) => {
                        const numeric = numericAccessors.has(cell.column.id);
                        const isCode = cell.column.id === "unitCode";
                        return (
                          <td
                            key={cell.id}
                            className={cn(
                              "h-[44px] px-4 align-middle text-[13px] whitespace-nowrap text-text-secondary",
                              numeric && "text-right tabular-nums",
                              (cell.column.id === "netAreaSqft" ||
                                cell.column.id === "grossAreaSqft") &&
                                "area",
                              (cell.column.id === "ratePerSqftPkr" ||
                                cell.column.id === "bookPricePkr") &&
                                "price",
                              isCode && "id text-ink",
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

      {pagination && (
        <div className="flex items-center justify-between border-t border-line bg-surface px-4 py-2.5 text-[12.5px] text-muted">
          <div>
            Showing {startRow}–{endRow} of {total}
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="default"
              size="sm"
              disabled={pagination.canPreviousPage === false}
              onClick={pagination.onPreviousPage}
            >
              Previous
            </Button>
            <Button
              variant="default"
              size="sm"
              disabled={pagination.canNextPage === false}
              onClick={pagination.onNextPage}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
