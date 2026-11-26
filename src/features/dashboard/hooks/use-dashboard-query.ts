"use client";

import { useQuery } from "@tanstack/react-query";
import { useServerInitialData } from "@/lib/query-cache";
import { getDashboardData } from "../actions";
import type {
  BlockBreakdownRow,
  DashboardFilterOptions,
  DashboardInstallmentItem,
  DashboardNeedsAttention,
  DashboardStats,
  FloorLedgerRow,
  RecentActivityItem,
  RecentBookingItem,
  SalesOverTimePoint,
} from "../queries";

export interface DashboardData {
  stats: DashboardStats;
  attention?: DashboardNeedsAttention;
  floors: FloorLedgerRow[];
  blocks: BlockBreakdownRow[];
  salesOverTime: SalesOverTimePoint[];
  collectionsByMonth?: SalesOverTimePoint[];
  receivablePkr?: string;
  activeBookingsCount?: number;
  monthCollectedPkr?: string;
  lastMonthCollectedPkr?: string;
  recentBookings?: RecentBookingItem[];
  overdueInstallments?: DashboardInstallmentItem[];
  dueNext7DaysInstallments?: DashboardInstallmentItem[];
  activities: RecentActivityItem[];
  filterOptions: DashboardFilterOptions;
}

export function useDashboardQuery(
  filter: { propertyId?: string; blockId?: string } | undefined,
  initialData?: DashboardData,
) {
  const serverData = useServerInitialData(initialData);
  return useQuery({
    queryKey: ["dashboard", filter?.propertyId ?? "", filter?.blockId ?? ""],
    queryFn: () => getDashboardData(filter),
    ...serverData,
    staleTime: 60_000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
