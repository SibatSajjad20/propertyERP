"use client";

import { useEffect, useMemo, useRef } from "react";
import { createColumnHelper, tableFeatures, useTable } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { DotsThree, Eye, PencilSimple } from "@phosphor-icons/react";
import { UnitStatusBadge } from "@/components/ui/unit-status-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/cn";
import { formatKarachiDate } from "@/lib/datetime";
import { formatPkrLedger } from "@/lib/money";
import { formatUnitNumberLabel } from "@/lib/area";
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
  onNearEnd?: () => void;
}

export function InventoryTable({
  data,
  query,
  selectedId,
  showSoldOn = false,
  canManage = false,
  onRowClick,
  onEdit,
  onSort,
  emptyMessage,
  onNearEnd,
}: InventoryTableProps) {
  const columns = useMemo(() => {
    const cols = [
      helper.accessor("unitCode", {
        header: "Unit code",
        cell: (info) => {
          const row = info.row.original;
          return (
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <span className="unit-code font-medium text-ink">{info.getValue()}</span>
              {row.isMergedUnit ? (
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                  Merged
                </span>
              ) : null}
            </span>
          );
        },
      }),
      helper.accessor("unitNumber", {
        header: "Unit no.",
        cell: (info) => (
          <span className="whitespace-nowrap">
            {formatUnitNumberLabel(
              info.row.original.unitCode,
              info.getValue(),
              info.row.original.categoryName,
            )}
          </span>
        ),
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
          <span className="area font-sans tabular-nums">{info.getValue()}</span>
        ),
      }),
      helper.accessor("grossAreaSqft", {
        header: "Gross sq ft",
        cell: (info) => (
          <span className="area font-sans tabular-nums">{info.getValue() ?? "—"}</span>
        ),
      }),
      helper.accessor("ratePerSqftPkr", {
        header: "Rate/sq ft",
        cell: (info) => (
          <span className="price font-sans tabular-nums">
            {formatPkrLedger(info.getValue())}
          </span>
        ),
      }),
      helper.accessor("bookPricePkr", {
        header: "Total price",
        cell: (info) => (
          <span className="price font-sans font-medium text-ink tabular-nums">
            {formatPkrLedger(info.getValue())}
          </span>
        ),
      }),
      helper.accessor("status", {
        header: "Status",
        cell: (info) => {
          const status = info.getValue();
          return <UnitStatusBadge status={status} />;
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
              <span className="font-sans text-ink-muted tabular-nums">
                {val ? formatKarachiDate(val) : "—"}
              </span>
            );
          },
        }),
      );
    }

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
                  className="flex size-8 items-center justify-center rounded-[8px] text-ink-muted opacity-70 transition-colors group-hover:opacity-100 hover:bg-subtle hover:text-ink focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
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
    estimateSize: () => 44,
    overscan: 12,
  });

  const lastVirtualIndex = virtualizer.getVirtualItems().at(-1)?.index;
  useEffect(() => {
    if (lastVirtualIndex !== undefined && lastVirtualIndex >= data.length - 12) {
      onNearEnd?.();
    }
  }, [lastVirtualIndex, data.length, onNearEnd]);

  function columnClass(id: string) {
    const visibility = (() => {
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
    })();

    const sizing = (() => {
      switch (id) {
        case "unitCode":
          return "w-28 min-w-[7rem] whitespace-nowrap";
        case "unitNumber":
          return "whitespace-nowrap min-w-[200px]";
        case "floorName":
          return "w-16 whitespace-nowrap";
        case "categoryName":
          return "w-24 whitespace-nowrap";
        case "netAreaSqft":
        case "grossAreaSqft":
          return "w-24 whitespace-nowrap";
        case "ratePerSqftPkr":
          return "w-28 whitespace-nowrap";
        case "bookPricePkr":
          return "w-32 whitespace-nowrap";
        case "status":
          return "w-28 whitespace-nowrap";
        case "ownershipGroup":
        case "soldAt":
          return "whitespace-nowrap";
        case "actions":
          return "w-10 px-1";
        default:
          return undefined;
      }
    })();

    return cn(visibility, sizing);
  }

  return (
    <div className="card flex min-h-0 flex-1 flex-col overflow-hidden">
      <div ref={parentRef} className="min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-[540px] border-collapse text-[13px]">
          <thead className="sticky top-0 z-20 border-b border-line bg-[#FAFBFC] select-none">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id} className="h-[38px]">
                {group.headers.map((header) => {
                  const numeric = numericAccessors.has(header.column.id);
                  const sortField = sortByColumn[header.column.id];
                  const active = sortField === query.sort;
                  return (
                    <th
                      key={header.id}
                      className={cn(
                        "h-[38px] px-3 text-left text-[12px] font-medium text-muted",
                        numeric && "text-right",
                        header.column.id === "actions" && "w-10 px-1",
                        header.column.id === "unitCode" &&
                          "sticky left-0 z-30 bg-[#FAFBFC] shadow-[1px_0_0_var(--line)]",
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
                            "inline-flex h-[38px] cursor-pointer items-center gap-1 transition-colors hover:text-ink",
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
                      "group h-11 cursor-pointer transition-colors duration-[120ms] ease-[var(--ease-ledger)] select-none",
                      selected
                        ? "bg-primary-soft font-medium text-ink"
                        : "text-ink hover:bg-[#F8FAFC]",
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
                            "h-11 px-3 align-middle",
                            numeric && "text-right",
                            cell.column.id === "actions" && "w-10 px-1",
                            cell.column.id === "unitCode" &&
                              "sticky left-0 z-10 bg-surface shadow-[1px_0_0_var(--line)] group-hover:bg-[#F8FAFC]",
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
                        "group h-11 cursor-pointer transition-colors duration-[120ms] ease-[var(--ease-ledger)] select-none",
                        selected
                          ? "bg-primary-soft font-medium text-ink"
                          : "text-ink hover:bg-[#F8FAFC]",
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
                              "h-11 px-3 align-middle",
                              numeric && "text-right",
                              cell.column.id === "actions" && "w-10 px-1",
                              cell.column.id === "unitCode" &&
                                "sticky left-0 z-10 bg-surface shadow-[1px_0_0_var(--line)] group-hover:bg-[#F8FAFC]",
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
        </table>
      </div>
    </div>
  );
}
