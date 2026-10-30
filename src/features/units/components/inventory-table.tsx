"use client";

import { useMemo, useRef } from "react";
import { createColumnHelper, tableFeatures, useTable } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { DotsThree, Eye, PencilSimple } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/cn";
import { formatKarachiDate } from "@/lib/datetime";
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
  soldAt: "soldAt",
};

export interface InventoryTableProps {
  data: InventoryRow[];
  totals: InventoryTotals;
  query: InventoryQuery;
  selectedId?: string;
  showSoldOn?: boolean;
  canManage?: boolean;
  canSell?: boolean;
  canReverse?: boolean;
  onRowClick: (row: InventoryRow) => void;
  onEdit?: (row: InventoryRow) => void;
  onSort: (field: InventorySortField) => void;
  emptyMessage: string;
}

export function InventoryTable({
  data,
  totals,
  query,
  selectedId,
  showSoldOn = false,
  canManage = false,
  onRowClick,
  onEdit,
  onSort,
  emptyMessage,
}: InventoryTableProps) {
  const columns = useMemo(() => {
    const cols = [
      helper.accessor("unitCode", {
        header: "Unit code",
        cell: (info) => (
          <span className="unit-code font-mono font-medium text-ink">
            {info.getValue()}
          </span>
        ),
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
        cell: (info) => (
          <span className="area font-mono tabular-nums">{info.getValue()}</span>
        ),
      }),
      helper.accessor("grossAreaSqft", {
        header: "Gross sq ft",
        cell: (info) => (
          <span className="area font-mono tabular-nums">{info.getValue() ?? "—"}</span>
        ),
      }),
      helper.accessor("ratePerSqftPkr", {
        header: "Rate/sq ft",
        cell: (info) => (
          <span className="price font-mono tabular-nums">
            {formatPkrLedger(info.getValue())}
          </span>
        ),
      }),
      helper.accessor("bookPricePkr", {
        header: "Total price",
        cell: (info) => (
          <span className="price font-mono font-medium text-ink tabular-nums">
            {formatPkrLedger(info.getValue())}
          </span>
        ),
      }),
      helper.accessor("status", {
        header: "Status",
        cell: (info) => {
          const status = info.getValue();
          return (
            <Badge tone={status === "SOLD" ? "sold" : "available"}>
              {status === "SOLD" ? "Sold" : "Available"}
            </Badge>
          );
        },
      }),
    ];

    if (showSoldOn) {
      cols.push(
        helper.accessor("soldAt", {
          header: "Sold on",
          cell: (info) => {
            const val = info.getValue();
            return (
              <span className="font-mono text-ink-muted tabular-nums">
                {val ? formatKarachiDate(val) : "—"}
              </span>
            );
          },
        }),
      );
    }

    cols.push(
      helper.accessor("ownershipGroup", {
        header: "Ownership group",
        cell: (info) => (
          <span className="truncate text-ink-muted">{info.getValue() ?? "—"}</span>
        ),
      }),
    );

    // Row Actions column "⋯"
    cols.push(
      helper.accessor("id", {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div
            className="flex items-center justify-end pr-1"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Actions"
                  className="flex size-7 items-center justify-center rounded-[4px] text-ink-muted opacity-70 transition-colors group-hover:opacity-100 hover:bg-subtle hover:text-ink focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
                >
                  <DotsThree weight="bold" className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem onClick={() => onRowClick(row.original)}>
                  <Eye weight="light" className="mr-2 size-3.5 text-ink-muted" />
                  View details
                </DropdownMenuItem>
                {canManage && onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(row.original)}>
                    <PencilSimple
                      weight="light"
                      className="mr-2 size-3.5 text-ink-muted"
                    />
                    Edit unit
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      }),
    );

    return helper.columns(cols);
  }, [showSoldOn, canManage, onRowClick, onEdit]);

  const table = useTable({
    features: inventoryTableFeatures,
    columns,
    data,
  });

  const parentRef = useRef<HTMLDivElement>(null);
  const rows = table.getRowModel().rows;
  // eslint-disable-next-line react-hooks/incompatible-library -- required virtualizer API
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36,
    overscan: 12,
  });

  function columnClass(id: string) {
    if (id === "grossAreaSqft" || id === "ownershipGroup" || id === "soldAt") {
      return "hidden xl:table-cell";
    }
    if (id === "ratePerSqftPkr" || id === "unitNumber" || id === "categoryName") {
      return "hidden md:table-cell";
    }
    if (id === "netAreaSqft") {
      return "hidden sm:table-cell";
    }
    return undefined;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[8px] border border-line bg-surface">
      <div ref={parentRef} className="min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-[540px] border-collapse text-[13px]">
          <thead className="sticky top-0 z-20 border-b border-line-strong bg-surface select-none">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id} className="h-9">
                {group.headers.map((header) => {
                  const numeric = numericAccessors.has(header.column.id);
                  const sortField = sortByColumn[header.column.id];
                  const active = sortField === query.sort;
                  return (
                    <th
                      key={header.id}
                      className={cn(
                        "h-9 px-3 text-left text-[11px] font-medium tracking-wide text-ink-muted uppercase",
                        numeric && "text-right",
                        header.column.id === "actions" && "w-10 px-1",
                        columnClass(header.column.id),
                      )}
                    >
                      {header.isPlaceholder || !sortField ? (
                        header.column.id === "actions" ? null : (
                          <table.FlexRender header={header} />
                        )
                      ) : (
                        <button
                          type="button"
                          className={cn(
                            "inline-flex h-9 cursor-pointer items-center gap-1 transition-colors hover:text-ink",
                            numeric && "w-full justify-end",
                            active && "font-semibold text-primary",
                          )}
                          onClick={() => onSort(sortField)}
                        >
                          <table.FlexRender header={header} />
                          {active ? (
                            <span className="ml-0.5 text-[10px]">
                              {query.dir === "desc" ? "↓" : "↑"}
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
          <tbody className="divide-y divide-line">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="h-32 px-4 text-center text-ink-muted"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : rows.length <= 60 ? (
              rows.map((row) => {
                const selected = row.original.id === selectedId;
                return (
                  <tr
                    key={row.id}
                    tabIndex={0}
                    aria-selected={selected}
                    className={cn(
                      "group h-9 cursor-pointer transition-colors duration-[120ms] ease-[var(--ease-ledger)] select-none",
                      selected
                        ? "bg-subtle font-medium text-ink"
                        : "text-ink hover:bg-subtle/70",
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
                      return (
                        <td
                          key={cell.id}
                          className={cn(
                            "h-9 px-3 align-middle",
                            numeric && "text-right",
                            cell.column.id === "actions" && "w-10 px-1",
                            columnClass(cell.column.id),
                          )}
                        >
                          <table.FlexRender cell={cell} />
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            ) : (
              <>
                {virtualizer.getVirtualItems().length > 0 ? (
                  <tr aria-hidden="true">
                    <td
                      colSpan={columns.length}
                      style={{ height: virtualizer.getVirtualItems()[0]?.start ?? 0 }}
                      className="border-none p-0"
                    />
                  </tr>
                ) : null}
                {virtualizer.getVirtualItems().map((virtualRow) => {
                  const row = rows[virtualRow.index];
                  if (!row) return null;
                  const selected = row.original.id === selectedId;
                  return (
                    <tr
                      key={row.id}
                      tabIndex={0}
                      aria-selected={selected}
                      className={cn(
                        "group h-9 cursor-pointer transition-colors duration-[120ms] ease-[var(--ease-ledger)] select-none",
                        selected
                          ? "bg-subtle font-medium text-ink"
                          : "text-ink hover:bg-subtle/70",
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
                        return (
                          <td
                            key={cell.id}
                            className={cn(
                              "h-9 px-3 align-middle",
                              numeric && "text-right",
                              cell.column.id === "actions" && "w-10 px-1",
                              columnClass(cell.column.id),
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
          <tfoot className="sticky bottom-0 z-20 border-t border-line-strong bg-surface select-none">
            <tr className="h-9">
              <td className="h-9 px-3 text-[12px] font-medium text-ink-muted" colSpan={4}>
                {totals.count === 1 ? "1 unit" : `${totals.count} units`}
              </td>
              <td className="area h-9 px-3 text-right font-mono text-[12px] font-medium text-ink tabular-nums">
                {totals.netAreaSqft}
              </td>
              <td colSpan={2} />
              <td className="price h-9 px-3 text-right font-mono text-[12px] font-semibold text-ink tabular-nums">
                {formatPkrLedger(totals.valuePkr)}
              </td>
              <td colSpan={showSoldOn ? 3 : 2} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
