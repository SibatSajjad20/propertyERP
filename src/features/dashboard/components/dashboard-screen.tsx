"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Plus } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import type { UserRole } from "@/db/schema/enums";
import { formatPkrCompact, formatPkrLedger } from "@/lib/money";
import type {
  BlockBreakdownRow,
  DashboardFilterOptions,
  DashboardNeedsAttention,
  DashboardStats,
  FloorLedgerRow,
  RecentActivityItem,
  SalesOverTimePoint,
} from "../queries";
import { PageHeader } from "@/components/page-header";
import { DashboardFilters } from "./dashboard-filters";
import { FloorStack } from "./floor-stack";
import { InventoryMixDonut } from "./inventory-mix-donut";
import { SalesOverTimeChart } from "./sales-over-time-chart";
import { useDashboardQuery } from "../hooks/use-dashboard-query";

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

function humanAction(action: string): {
  label: string;
  tone: "primary" | "available" | "sold" | "muted";
} {
  switch (action) {
    case "UNIT_CREATED":
    case "CREATE":
      return { label: "created", tone: "primary" };
    case "UNIT_UPDATED":
    case "UPDATE":
      return { label: "updated", tone: "muted" };
    case "STATUS_CHANGED":
    case "STATUS_CHANGE":
      return { label: "changed status of", tone: "primary" };
    case "SOLD":
    case "SALE":
      return { label: "sold", tone: "sold" };
    case "REVERSED":
    case "REVERSE_SALE":
      return { label: "reversed sale of", tone: "available" };
    case "FLOOR_CREATED":
      return { label: "added floor", tone: "primary" };
    case "DELETE":
      return { label: "deleted", tone: "sold" };
    default:
      return { label: action.replaceAll("_", " ").toLowerCase(), tone: "muted" };
  }
}

export interface DashboardScreenProps {
  stats: DashboardStats;
  attention?: DashboardNeedsAttention;
  floors: FloorLedgerRow[];
  blocks: BlockBreakdownRow[];
  salesOverTime: SalesOverTimePoint[];
  activities: RecentActivityItem[];
  filterOptions: DashboardFilterOptions;
  selectedPropertyId?: string;
  selectedBlockId?: string;
  role: UserRole;
  canManage: boolean;
}

export function DashboardScreen({
  stats: initialStats,
  attention: initialAttention,
  floors: initialFloors,
  blocks: initialBlocks,
  salesOverTime: initialSalesOverTime,
  activities: initialActivities,
  filterOptions: initialFilterOptions,
  selectedPropertyId,
  selectedBlockId,
  role,
  canManage,
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
  const activities = (dashboardData?.activities ?? initialActivities).slice(0, 8);
  const filterOptions = dashboardData?.filterOptions ?? initialFilterOptions;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Commercial inventory, real-time asking value, and floor-level absorption."
        actions={
          <>
            <DashboardFilters
              options={filterOptions}
              selectedPropertyId={selectedPropertyId}
              selectedBlockId={selectedBlockId}
            />
            <Button variant="secondary" size="md" asChild>
              <Link href="/structure">View structure</Link>
            </Button>
            {canManage && (
              <Button variant="primary" size="md" asChild>
                <Link href="/units/new">
                  <Plus weight="light" className="size-4" />
                  New unit
                </Link>
              </Button>
            )}
          </>
        }
      />

      {/* Row 1: 6 Stat Cards (dots match status colours, count-up animation, Lac/Cr) */}
      <div className="grid auto-rows-fr grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Available"
          value={stats.available}
          indicator="available"
          tone="available"
          caption={formatPkrCompact(stats.availableValuePkr)}
          captionTooltip={`${stats.available} available (${formatPkrLedger(stats.availableValuePkr)})`}
        />
        <StatCard
          label="Reserved"
          value={stats.reserved}
          indicator="reserved"
          tone="reserved"
          caption={formatPkrCompact(stats.reservedValuePkr)}
          captionTooltip={`${stats.reserved} reserved (${formatPkrLedger(stats.reservedValuePkr)})`}
        />
        <StatCard
          label="Booked"
          value={stats.booked}
          indicator="booked"
          tone="booked"
          caption={formatPkrCompact(stats.bookedValuePkr)}
          captionTooltip={`${stats.booked} booked (${formatPkrLedger(stats.bookedValuePkr)})`}
        />
        <StatCard
          label="Sold"
          value={stats.sold}
          indicator="sold"
          tone="sold"
          caption={`${stats.soldPercent.toFixed(1)}% (${formatPkrCompact(stats.soldValuePkr)})`}
          captionTooltip={`${stats.sold} sold (${formatPkrLedger(stats.soldValuePkr)})`}
        />
        <StatCard
          label="Net collected"
          value={formatPkrCompact(stats.netCollectedPkr)}
          caption="net of refunds"
          captionTooltip={`Collected net of refunds: ${formatPkrLedger(stats.netCollectedPkr)}`}
        />
        <StatCard
          label="Reversals this month"
          value={formatPkrCompact(stats.monthReversalsPkr)}
          caption="refunds & buybacks"
          captionTooltip={`Refunds & buybacks this month: ${formatPkrLedger(stats.monthReversalsPkr)}`}
        />
      </div>

      {/* Row 2: "Needs attention" Cards (Overdue installments, Due this week, Reservations expiring in 48h) */}
      <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-3">
        {/* Overdue installments */}
        <Link
          href="/reports/installments?quickFilter=overdue"
          className="card card-interactive group flex flex-col justify-between border-l-4 border-l-sold p-5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-sold" aria-hidden="true" />
              <p className="text-[11px] font-semibold tracking-wider text-ink-muted uppercase">
                Overdue Installments
              </p>
            </div>
            <ArrowRight
              weight="light"
              className="size-3.5 text-ink-muted transition-transform group-hover:translate-x-0.5 group-hover:text-sold"
            />
          </div>
          <div className="mt-3">
            <span className="text-[26px] leading-none font-bold text-sold tabular-nums sm:text-[28px]">
              {attention.overdueCount}
            </span>
            <p className="mt-1 truncate font-sans text-[11px] text-ink-muted tabular-nums">
              {formatPkrCompact(attention.overduePkr)} past due
            </p>
          </div>
        </Link>

        {/* Due this week */}
        <Link
          href="/reports/installments?quickFilter=due_this_week"
          className="card card-interactive group flex flex-col justify-between border-l-4 border-l-booked p-5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-booked" aria-hidden="true" />
              <p className="text-[11px] font-semibold tracking-wider text-ink-muted uppercase">
                Due This Week
              </p>
            </div>
            <ArrowRight
              weight="light"
              className="size-3.5 text-ink-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
            />
          </div>
          <div className="mt-3">
            <span className="text-[26px] leading-none font-bold text-primary tabular-nums sm:text-[28px]">
              {attention.dueThisWeekCount}
            </span>
            <p className="mt-1 truncate font-sans text-[11px] text-ink-muted tabular-nums">
              {formatPkrCompact(attention.dueThisWeekPkr)} scheduled next 7d
            </p>
          </div>
        </Link>

        {/* Reservations expiring in 48h */}
        <Link
          href="/reports/reserved"
          className="card card-interactive group flex flex-col justify-between border-l-4 border-l-reserved p-5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-reserved" aria-hidden="true" />
              <p className="text-[11px] font-semibold tracking-wider text-ink-muted uppercase">
                Reservations Expiring in 48h
              </p>
            </div>
            <ArrowRight
              weight="light"
              className="size-3.5 text-ink-muted transition-transform group-hover:translate-x-0.5 group-hover:text-reserved"
            />
          </div>
          <div className="mt-3">
            <span className="text-[26px] leading-none font-bold text-reserved tabular-nums sm:text-[28px]">
              {attention.expiringReservationsCount}
            </span>
            <p className="mt-1 truncate font-sans text-[11px] text-ink-muted tabular-nums">
              Active holds nearing cutoff
            </p>
          </div>
        </Link>
      </div>

      {/* Row 3: Sales over time (2/3) + Inventory mix (1/3) with equal card heights */}
      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
        {/* Sales Chart: 8 cols */}
        <div className="card flex min-h-[340px] flex-col justify-between p-5 lg:col-span-8">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <h2 className="text-[14px] font-semibold text-ink">Sales over time</h2>
              <p className="text-[12px] text-ink-muted">
                Absorption volume &amp; unit velocity
              </p>
            </div>
            <span className="text-[11px] font-medium text-ink-muted">
              Monthly PKR volume
            </span>
          </div>
          <div className="mt-4 flex-1">
            <SalesOverTimeChart data={salesOverTime} />
          </div>
        </div>

        {/* Donut: 4 cols */}
        <div className="card flex min-h-[340px] flex-col justify-between p-5 lg:col-span-4">
          <div className="border-b border-line pb-3">
            <h2 className="text-[14px] font-semibold text-ink">Inventory mix</h2>
            <p className="text-[12px] text-ink-muted">
              Absorption by commercial book value
            </p>
          </div>
          <div className="mt-4 flex-1">
            <InventoryMixDonut
              availableValuePkr={stats.availableValuePkr}
              reservedValuePkr={stats.reservedValuePkr}
              bookedValuePkr={stats.bookedValuePkr}
              soldValuePkr={stats.soldValuePkr}
            />
          </div>
        </div>
      </div>

      {/* Row 4: Floor stack (2/3) + Recent activity (1/3) with equal card heights */}
      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
        {/* Floor Stack: 8 cols */}
        <div className="card flex min-h-[360px] flex-col justify-between p-5 lg:col-span-8">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <h2 className="text-[14px] font-semibold text-ink">Floor stack</h2>
              <p className="text-[12px] text-ink-muted">
                Building absorption from top floor to ground
              </p>
            </div>
            <Link
              href="/inventory"
              className="group flex items-center gap-1 text-[12px] font-medium text-primary hover:underline"
            >
              Browse all units
              <ArrowRight
                weight="light"
                className="size-3 transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          </div>
          <div className="mt-4 flex-1">
            <FloorStack floors={floors} />
          </div>
        </div>

        {/* Recent Activity: 4 cols */}
        <div className="card flex min-h-[360px] flex-col justify-between p-5 lg:col-span-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <h2 className="text-[14px] font-semibold text-ink">Recent activity</h2>
              <p className="text-[12px] text-ink-muted">Audit trail events (last 8)</p>
            </div>
            {canSeeAudit && (
              <Link
                href="/audit"
                className="group flex items-center gap-1 text-[12px] font-medium text-primary hover:underline"
              >
                View all
                <ArrowRight
                  weight="light"
                  className="size-3 transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            )}
          </div>

          <div className="mt-3 flex-1 overflow-y-auto">
            {canSeeAudit ? (
              activities.length === 0 ? (
                <div className="flex h-36 items-center justify-center text-[12px] text-ink-muted">
                  No activity recorded yet.
                </div>
              ) : (
                <ul className="divide-y divide-line/60">
                  {activities.map((act) => {
                    const info = humanAction(act.action);
                    return (
                      <li key={act.id} className="py-2.5 first:pt-0 last:pb-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="truncate font-sans text-[12px] text-ink">
                            <span className="font-semibold">{act.actorName}</span>{" "}
                            <span className="text-ink-muted">{info.label}</span>{" "}
                            <span className="unit-code font-semibold text-primary">
                              {act.targetName}
                            </span>
                          </p>
                          <span className="shrink-0 text-[10px] text-ink-muted">
                            {formatRelativeTime(act.createdAt)}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )
            ) : (
              <div className="flex h-36 flex-col items-center justify-center text-center text-[12px] text-ink-muted">
                <p>Audit trail is visible to Administrators and Inventory Managers.</p>
                <div className="mt-4 flex gap-2">
                  <Button variant="secondary" size="sm" asChild>
                    <Link href="/inventory">Inventory</Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
