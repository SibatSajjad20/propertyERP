"use client";

import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useServerInitialData } from "@/lib/query-cache";
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
  totalCount: number;
  nextCursor: string | null;
  pageSize: number;
}

function inventoryKey(query: InventoryQuery) {
  return [
    "inventory",
    query.q ?? "",
    query.floorId ?? "",
    query.categoryId ?? "",
    query.status ?? "",
    query.sellable === undefined ? "" : String(query.sellable),
    Boolean(query.missingGross),
    query.sort,
    query.dir,
  ] as const;
}

export function useInventoryQuery(
  query: InventoryQuery,
  initialData?: InventoryQueryResult,
) {
  const serverData = useServerInitialData(
    initialData
      ? {
          pages: [initialData],
          pageParams: [undefined as string | undefined],
        }
      : undefined,
  );

  const result = useInfiniteQuery({
    queryKey: inventoryKey(query),
    queryFn: ({ pageParam }) =>
      getInventoryData({
        ...query,
        cursor: pageParam,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    ...serverData,
  });

  const pages = result.data?.pages ?? [];
  const rows = pages.flatMap((page) => page.rows);
  const totals = pages[0]?.totals ?? initialData?.totals;
  const totalCount = pages[0]?.totalCount ?? initialData?.totalCount ?? rows.length;

  return {
    ...result,
    rows,
    totals,
    totalCount,
  };
}

export function useInventoryOptionsQuery(initialData?: InventoryFilterOptions) {
  const serverData = useServerInitialData(initialData);
  return useQuery({
    queryKey: ["inventory-options"],
    queryFn: () => getInventoryOptions(),
    ...serverData,
    staleTime: 60_000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useUnitDetailQuery(
  id: string,
  initialData?: { row: UnitDetail | null; history: StatusHistoryEntry[] },
) {
  const serverData = useServerInitialData(initialData);
  return useQuery({
    queryKey: ["unit-detail", id],
    queryFn: () => getUnitDetail(id),
    ...serverData,
    staleTime: 60_000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: Boolean(id),
  });
}
