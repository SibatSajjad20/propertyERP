"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Plus } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { StatStrip, StatCell } from "@/components/ui/stat-strip";
import { Panel } from "@/components/ui/panel";
import { ActivityList, type ActivityItem } from "@/components/ui/activity-list";
import { PageHeader } from "@/components/page-header";
import type { UserRole } from "@/db/schema/enums";
import { formatPkrCompact } from "@/lib/money";
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
import { DashboardFilters } from "./dashboard-filters";
import { FloorAvailabilityPanel } from "./floor-availability-panel";
import { DashboardInstallmentsPanel } from "./dashboard-installments-panel";
import { DashboardRecentBookingsPanel } from "./dashboard-recent-bookings-panel";
import { CollectionsChartSkeleton } from "./collections-chart";
import { useDashboardQuery } from "../hooks/use-dashboard-query";

const DynamicCollectionsChart = dynamic(
  () => import("./collections-chart").then((mod) => mod.CollectionsChart),
  {
    loading: () => <CollectionsChartSkeleton />,
    ssr: false,
  },
);

function formatRelativeTime(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function humanAction(action: string): { label: string } {
  switch (action) {
    case "UNIT_CREATED":
    case "CREATE":
      return { label: "created" };
    case "UNIT_UPDATED":
    case "UPDATE":
      return { label: "updated" };
    case "STATUS_CHANGED":
    case "STATUS_CHANGE":
      return { label: "changed status of" };
    case "SOLD":
    case "SALE":
      return { label: "sold" };
    case "REVERSED":
    case "REVERSE_SALE":
      return { label: "reversed sale of" };
    case "FLOOR_CREATED":
      return { label: "added floor" };
    case "DELETE":
      return { label: "deleted" };
    default:
      return { label: action.replaceAll("_", " ").toLowerCase() };
  }
}

export interface DashboardScreenProps {
  stats: DashboardStats;
  attention?: DashboardNeedsAttention;
  floors: FloorLedgerRow[];
  blocks: BlockBreakdownRow[];
  salesOverTime: SalesOverTimePoint[];
  collectionsByMonth: SalesOverTimePoint[];
  receivablePkr: string;
  activeBookingsCount: number;
  monthCollectedPkr: string;
  lastMonthCollectedPkr: string;
  recentBookings: RecentBookingItem[];
  overdueInstallments: DashboardInstallmentItem[];
  dueNext7DaysInstallments: DashboardInstallmentItem[];
  activities: RecentActivityItem[];
  filterOptions: DashboardFilterOptions;
  selectedPropertyId?: string;
  selectedBlockId?: string;
  role: UserRole;
  canManage: boolean;
  canCreateBooking?: boolean;
}

export function DashboardScreen({
  stats: initialStats,
  attention: initialAttention,
  floors: initialFloors,
  blocks: initialBlocks,
  salesOverTime: initialSalesOverTime,
  collectionsByMonth: initialCollectionsByMonth,
  receivablePkr: initialReceivablePkr,
  activeBookingsCount: initialActiveBookingsCount,
  monthCollectedPkr: initialMonthCollectedPkr,
  lastMonthCollectedPkr: initialLastMonthCollectedPkr,
  recentBookings: initialRecentBookings,
  overdueInstallments: initialOverdueInstallments,
  dueNext7DaysInstallments: initialDueNext7DaysInstallments,
  activities: initialActivities,
  filterOptions: initialFilterOptions,
  selectedPropertyId,
  selectedBlockId,
  role,
  canCreateBooking = false,
}: DashboardScreenProps) {
  const canSeeAudit = role !== "SALES";

  const filter = React.useMemo(() => {
    if (!selectedPropertyId && !selectedBlockId) return undefined;
    return {
      propertyId: selectedPropertyId || undefined,
      blockId: selectedBlockId || undefined,
    };
  }, [selectedPropertyId, selectedBlockId]);

  const { data: dashboardData } = useDashboardQuery(filter, {
    stats: initialStats,
    attention: initialAttention,
    floors: initialFloors,
    blocks: initialBlocks,
    salesOverTime: initialSalesOverTime,
    collectionsByMonth: initialCollectionsByMonth,
    receivablePkr: initialReceivablePkr,
    activeBookingsCount: initialActiveBookingsCount,
    monthCollectedPkr: initialMonthCollectedPkr,
    lastMonthCollectedPkr: initialLastMonthCollectedPkr,
    recentBookings: initialRecentBookings,
    overdueInstallments: initialOverdueInstallments,
    dueNext7DaysInstallments: initialDueNext7DaysInstallments,
    activities: initialActivities,
    filterOptions: initialFilterOptions,
  });

  const stats = dashboardData?.stats ?? initialStats;
  const attention = dashboardData?.attention ??
    initialAttention ?? {
      overdueCount: 0,
      overduePkr: "0",
      dueThisWeekCount: 0,
      dueThisWeekPkr: "0",
      expiringReservationsCount: 0,
    };
  const floors = dashboardData?.floors ?? initialFloors;
  const salesOverTime = dashboardData?.salesOverTime ?? initialSalesOverTime;
  const collectionsByMonth =
    dashboardData?.collectionsByMonth ?? initialCollectionsByMonth;
  const receivablePkr = dashboardData?.receivablePkr ?? initialReceivablePkr;
  const activeBookingsCount =
    dashboardData?.activeBookingsCount ?? initialActiveBookingsCount;
  const monthCollectedPkr = dashboardData?.monthCollectedPkr ?? initialMonthCollectedPkr;
  const lastMonthCollectedPkr =
    dashboardData?.lastMonthCollectedPkr ?? initialLastMonthCollectedPkr;
  const recentBookings = dashboardData?.recentBookings ?? initialRecentBookings;
  const overdueInstallments =
    dashboardData?.overdueInstallments ?? initialOverdueInstallments;
  const dueNext7DaysInstallments =
    dashboardData?.dueNext7DaysInstallments ?? initialDueNext7DaysInstallments;
  const activities = (dashboardData?.activities ?? initialActivities).slice(0, 5);
  const filterOptions = dashboardData?.filterOptions ?? initialFilterOptions;

  // Format today's date in Asia/Karachi
  const todayFormatted = React.useMemo(() => {
    try {
      return new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Karachi",
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date());
    } catch {
      return new Date().toLocaleDateString("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
  }, []);

  // Filter scope string
  const filterScope = React.useMemo(() => {
    if (selectedBlockId) {
      const block = filterOptions.blocks.find((b) => b.id === selectedBlockId);
      if (block) return `${block.name} · All floors`;
    }
    if (selectedPropertyId) {
      const prop = filterOptions.properties.find((p) => p.id === selectedPropertyId);
      if (prop) return `${prop.name} · All floors`;
    }
    return "All blocks · All floors";
  }, [selectedBlockId, selectedPropertyId, filterOptions]);

  // Delta calculation for Collected this month
  const monthCollected = Number(monthCollectedPkr) || 0;
  const lastMonthCollected = Number(lastMonthCollectedPkr) || 0;
  const hasLastMonthData = lastMonthCollected > 0;
  const deltaPct = hasLastMonthData
    ? Math.round(((monthCollected - lastMonthCollected) / lastMonthCollected) * 100)
    : null;

  // Month names for sub-line
  const lastMonthName = React.useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toLocaleString("en-US", { month: "short" });
  }, []);

  // Activity list items
  const activityItems: ActivityItem[] = React.useMemo(() => {
    return activities.map((act) => {
      const info = humanAction(act.action);
      return {
        id: act.id,
        title: (
          <span>
            <span className="font-medium text-ink">{act.actorName}</span>{" "}
            <span className="text-muted">{info.label}</span>{" "}
            <span className="font-sans font-medium text-primary">{act.targetName}</span>
          </span>
        ),
        time: formatRelativeTime(act.createdAt),
      };
    });
  }, [activities]);

  const bookedPlusSold = stats.booked + stats.sold;
  const totalUnits = stats.total || 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        meta={[todayFormatted, filterScope]}
        actions={
          <div className="flex items-center gap-2">
            <DashboardFilters
              options={filterOptions}
              selectedPropertyId={selectedPropertyId}
              selectedBlockId={selectedBlockId}
            />
            {canCreateBooking && (
              <Button variant="primary" size="md" asChild>
                <Link href="/bookings/new">
                  <Plus weight="light" className="size-4" />
                  <span>New booking</span>
                </Link>
              </Button>
            )}
          </div>
        }
      />

      {/* Row 1: StatStrip, 5 cells */}
      <StatStrip columns="1.15fr 1.2fr 1fr 1fr 1fr" className="mb-0">
        {/* 1. Collected this month */}
        <StatCell
          label="Collected this month"
          value={formatPkrCompact(monthCollectedPkr)}
          prefixRs
          rightLabel={
            deltaPct !== null ? (
              <span
                className={`text-[11.5px] font-semibold tabular-nums ${
                  deltaPct >= 0 ? "text-good" : "text-muted"
                }`}
              >
                {deltaPct >= 0 ? `+${deltaPct}%` : `${deltaPct}%`}
              </span>
            ) : undefined
          }
          subLine={
            hasLastMonthData
              ? `Rs ${formatPkrCompact(lastMonthCollectedPkr)} in ${lastMonthName}`
              : undefined
          }
        />

        {/* 2. Booked & sold */}
        <StatCell
          label="Booked & sold"
          value={`${bookedPlusSold}`}
          suffix={`of ${stats.total}`}
          subLine={`${stats.total > 0 ? Math.round((bookedPlusSold / stats.total) * 100) : 0}% of units`}
          progress={[
            {
              percent: (stats.sold / totalUnits) * 100,
              color: "#0B3F66",
            },
            {
              percent: (stats.booked / totalUnits) * 100,
              color: "#0B558B",
            },
            {
              percent: (stats.reserved / totalUnits) * 100,
              color: "#7FA6C6",
            },
          ]}
        />

        {/* 3. Receivable */}
        <StatCell
          label="Receivable"
          value={formatPkrCompact(receivablePkr)}
          prefixRs
          subLine={`Across ${activeBookingsCount} active bookings`}
        />

        {/* 4. Due next 7 days */}
        <StatCell
          label="Due next 7 days"
          value={formatPkrCompact(attention.dueThisWeekPkr)}
          prefixRs
          subLine={`${attention.dueThisWeekCount} installments`}
        />

        {/* 5. Overdue */}
        <StatCell
          label="Overdue"
          value={formatPkrCompact(attention.overduePkr)}
          prefixRs
          valueClassName="text-bad"
          subLine={`${attention.overdueCount} installments`}
        />
      </StatStrip>

      {/* Row 2: Collections chart (1fr) + Availability by floor (452px) */}
      <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-[1fr_452px]">
        <Panel
          title="Collections & bookings value"
          hint="Absorption and cash inflows over 12 months"
          className="flex flex-col"
          bodyClassName="p-5 flex-1"
        >
          <DynamicCollectionsChart
            collectionsData={collectionsByMonth}
            salesData={salesOverTime}
          />
        </Panel>

        <FloorAvailabilityPanel floors={floors} />
      </div>

      {/* Row 3: Installments (1.12fr) + Recent bookings (1fr) + Activity (0.86fr) */}
      <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-[1.12fr_1fr_0.86fr]">
        <DashboardInstallmentsPanel
          overdueInstallments={overdueInstallments}
          dueNext7DaysInstallments={dueNext7DaysInstallments}
        />

        <DashboardRecentBookingsPanel bookings={recentBookings} />

        <Panel
          title="Recent activity"
          hint="Audit trail events"
          actions={
            canSeeAudit ? (
              <Link
                href="/audit"
                className="text-[12.5px] font-medium text-primary transition-colors hover:text-primary-hover"
              >
                Audit log
              </Link>
            ) : null
          }
          bodyClassName="p-5"
        >
          {canSeeAudit ? (
            <ActivityList items={activityItems} />
          ) : (
            <div className="py-8 text-center text-[12.5px] text-muted">
              Audit trail is visible to Administrators and Inventory Managers.
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
