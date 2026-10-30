"use client";

import { useQuery } from "@tanstack/react-query";
import { getDashboardData } from "../actions";
import type {
  BlockBreakdownRow,
  DashboardFilterOptions,
  DashboardStats,
  FloorLedgerRow,
  RecentActivityItem,
  SalesOverTimePoint,
} from "../queries";

export interface DashboardData {
  stats: DashboardStats;
  floors: FloorLedgerRow[];
  blocks: BlockBreakdownRow[];
  salesOverTime: SalesOverTimePoint[];
  activities: RecentActivityItem[];
  filterOptions: DashboardFilterOptions;
}

export function useDashboardQuery(
  filter: { propertyId?: string; blockId?: string } | undefined,
  initialData?: DashboardData,
) {
  return useQuery({
    queryKey: ["dashboard", filter?.propertyId ?? "", filter?.blockId ?? ""],
    queryFn: () => getDashboardData(filter),
    initialData,
    staleTime: 60_000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
