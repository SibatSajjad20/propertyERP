"use client";

import { useQuery } from "@tanstack/react-query";
import { getInventoryData, getInventoryOptions, getUnitDetail } from "../actions";
import type { InventoryQuery } from "../schema";
import type {
  InventoryFilterOptions,
  InventoryRow,
  InventoryTotals,
  StatusHistoryEntry,
  UnitDetail,
} from "../types";

export interface InventoryQueryResult {
  rows: InventoryRow[];
  totals: InventoryTotals;
}

export function useInventoryQuery(
  query: InventoryQuery,
  initialData?: InventoryQueryResult,
) {
  return useQuery({
    queryKey: [
      "inventory",
      query.q ?? "",
      query.floorId ?? "",
      query.categoryId ?? "",
      query.status ?? "",
      query.sellable === undefined ? "" : String(query.sellable),
      Boolean(query.missingGross),
      query.sort,
      query.dir,
    ],
    queryFn: () => getInventoryData(query),
    initialData,
    staleTime: 60_000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useInventoryOptionsQuery(initialData?: InventoryFilterOptions) {
  return useQuery({
    queryKey: ["inventory-options"],
    queryFn: () => getInventoryOptions(),
    initialData,
    staleTime: 60_000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useUnitDetailQuery(
  id: string,
  initialData?: { row: UnitDetail | null; history: StatusHistoryEntry[] },
) {
  return useQuery({
    queryKey: ["unit-detail", id],
    queryFn: () => getUnitDetail(id),
    initialData,
    staleTime: 60_000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: Boolean(id),
  });
}
