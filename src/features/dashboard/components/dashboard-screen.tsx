"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Plus } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { AnimatedNumber } from "@/components/ui/animated-number";
import type { UserRole } from "@/db/schema/enums";
import { formatPkrCompact, formatPkrLedger } from "@/lib/money";
import type {
  BlockBreakdownRow,
  DashboardFilterOptions,
  DashboardStats,
  FloorLedgerRow,
  RecentActivityItem,
  SalesOverTimePoint,
} from "../queries";
import { PageHeader } from "@/components/page-header";
import { DashboardFilters } from "./dashboard-filters";
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
    floors: initialFloors,
    blocks: initialBlocks,
    salesOverTime: initialSalesOverTime,
    activities: initialActivities,
    filterOptions: initialFilterOptions,
  });

  const stats = dashboardData?.stats ?? initialStats;
  const floors = dashboardData?.floors ?? initialFloors;
  const blocks = dashboardData?.blocks ?? initialBlocks;
  const salesOverTime = dashboardData?.salesOverTime ?? initialSalesOverTime;
  const activities = dashboardData?.activities ?? initialActivities;
  const filterOptions = dashboardData?.filterOptions ?? initialFilterOptions;

  return (
    <div className="space-y-8">
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
                  <Plus weight="light" className="mr-1.5 size-3.5" />
                  New unit
                </Link>
              </Button>
            )}
          </>
        }
      />

      {/* Overview Cards: Grid of separate KPI cards (2/3/6 cols) */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {/* 1. Total units */}
        <div className="card card-interactive kpi flex flex-col justify-between p-4 sm:p-5">
          <p className="text-[11px] font-medium tracking-wider text-ink-muted uppercase">
            Total units
          </p>
          <div className="mt-3">
            <span className="text-[26px] leading-none font-semibold text-ink sm:text-[28px]">
              <AnimatedNumber value={stats.total} />
            </span>
            <p className="mt-1 text-[11px] text-ink-muted">in inventory</p>
          </div>
        </div>

        {/* 2. Available units */}
        <div className="card card-interactive kpi flex flex-col justify-between p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium tracking-wider text-ink-muted uppercase">
              Available
            </p>
            <span className="size-2 rounded-full bg-available" aria-hidden="true" />
          </div>
          <div className="mt-3">
            <span className="text-[26px] leading-none font-semibold text-available sm:text-[28px]">
              <AnimatedNumber value={stats.available} />
            </span>
            <p className="mt-1 text-[11px] text-ink-muted">ready to sell</p>
          </div>
        </div>

        {/* 3. Sold units */}
        <div className="card card-interactive kpi flex flex-col justify-between p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium tracking-wider text-ink-muted uppercase">
              Sold
            </p>
            <span className="size-2 rounded-full bg-sold" aria-hidden="true" />
          </div>
          <div className="mt-3">
            <span className="text-[26px] leading-none font-semibold text-sold sm:text-[28px]">
              <AnimatedNumber value={stats.sold} />
            </span>
            <p className="mt-1 text-[11px] text-ink-muted">committed deals</p>
          </div>
        </div>

        {/* 4. % Sold */}
        <div className="card card-interactive kpi flex flex-col justify-between p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium tracking-wider text-ink-muted uppercase">
              % Sold
            </p>
            <span className="size-2 rounded-full bg-accent/60" aria-hidden="true" />
          </div>
          <div className="mt-3">
            <span className="text-[26px] leading-none font-semibold text-ink sm:text-[28px]">
              <AnimatedNumber value={stats.soldPercent.toFixed(1)} suffix="%" />
            </span>
            <p className="mt-1 text-[11px] text-ink-muted">absorption rate</p>
          </div>
        </div>

        {/* 5. Available inventory value */}
        <div className="card card-interactive kpi flex flex-col justify-between p-4 sm:p-5">
          <p className="text-[11px] font-medium tracking-wider text-ink-muted uppercase">
            Available value
          </p>
          <div className="mt-3">
            <span className="text-[22px] leading-none font-semibold text-ink sm:text-[24px]">
              <AnimatedNumber value={formatPkrCompact(stats.availableValuePkr)} />
            </span>
            <p
              className="mt-1 truncate font-sans text-[11px] text-ink-muted tabular-nums"
              title={formatPkrLedger(stats.availableValuePkr)}
            >
              area × rate
            </p>
          </div>
        </div>

        {/* 6. Total sold value */}
        <div className="card card-interactive kpi flex flex-col justify-between p-4 sm:p-5">
          <p className="text-[11px] font-medium tracking-wider text-ink-muted uppercase">
            Sold value
          </p>
          <div className="mt-3">
            <span className="text-[22px] leading-none font-semibold text-ink sm:text-[24px]">
              <AnimatedNumber value={formatPkrCompact(stats.soldValuePkr)} />
            </span>
            <p
              className="mt-1 truncate font-sans text-[11px] text-ink-muted tabular-nums"
              title={formatPkrLedger(stats.soldValuePkr)}
            >
              Frozen at sale
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Floor ledger (left) + Block breakdown & Sales chart & Recent activity (right) */}
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* Left Column (7 cols): Ledger-style Units by floor */}
        <section className="space-y-4 lg:col-span-7">
          <div className="flex items-center justify-between border-b border-line pb-2.5">
            <div>
              <h2 className="text-[14px] font-semibold text-ink">Units by floor</h2>
              <p className="text-[12px] text-ink-muted">
                Absorption stack per floor level · click row to filter inventory
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-medium text-ink-muted">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-sold" /> Sold
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-available" /> Available
              </span>
            </div>
          </div>

          {floors.length === 0 ? (
            <div className="card p-6 text-center text-[13px] text-ink-muted">
              No floors match the current filters.
            </div>
          ) : (
            <div className="card divide-y divide-line overflow-hidden">
              {floors.map((fl) => {
                const soldPct = fl.total > 0 ? (fl.sold / fl.total) * 100 : 0;
                const availPct = fl.total > 0 ? (fl.available / fl.total) * 100 : 0;
                return (
                  <Link
                    key={fl.floorId}
                    href={`/inventory?floorId=${fl.floorId}`}
                    className="group flex cursor-pointer flex-col justify-between gap-3 px-4 py-3 transition-colors hover:bg-subtle/50 sm:flex-row sm:items-center"
                    title={`View inventory on ${fl.floorName}`}
                  >
                    <div className="w-32 shrink-0">
                      <p className="text-[13px] font-medium text-ink transition-colors group-hover:text-primary">
                        {fl.floorName}
                      </p>
                      <p className="text-[11px] text-ink-muted">
                        Level {fl.level} · {fl.blockName}
                      </p>
                    </div>

                    {/* Proportional bar (available vs sold) with width animated on mount */}
                    <div className="mx-2 min-w-0 flex-1">
                      <div className="flex h-2.5 w-full overflow-hidden rounded-full border border-line/60 bg-subtle">
                        {soldPct > 0 && (
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${soldPct}%` }}
                            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                            className="h-full bg-sold"
                            title={`Sold: ${fl.sold} (${Math.round(soldPct)}%)`}
                          />
                        )}
                        {availPct > 0 && (
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${availPct}%` }}
                            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                            className="h-full bg-available"
                            title={`Available: ${fl.available} (${Math.round(availPct)}%)`}
                          />
                        )}
                      </div>
                    </div>

                    {/* Sold / total and value right-aligned in tabular numbers */}
                    <div className="w-36 shrink-0 text-right">
                      <div className="font-sans text-[13px] text-ink tabular-nums">
                        <span className="font-medium">{fl.sold}</span>
                        <span className="text-[12px] text-ink-muted"> / {fl.total}</span>
                        <span className="ml-1 text-[11px] text-ink-muted tabular-nums">
                          ({Math.round(soldPct)}%)
                        </span>
                      </div>
                      <p className="font-sans text-[11px] text-ink-muted tabular-nums">
                        {formatPkrCompact(fl.totalValuePkr)}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Right Column (5 cols): Block breakdown + Sales over time + Recent activity */}
        <div className="space-y-8 lg:col-span-5">
          {/* Block breakdown table */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <div>
                <h2 className="text-[14px] font-semibold text-ink">Block breakdown</h2>
                <p className="text-[12px] text-ink-muted">
                  Absorption across wings & blocks
                </p>
              </div>
            </div>

            <div className="card overflow-hidden">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-line bg-subtle/40 text-[11px] font-medium tracking-wider text-ink-muted uppercase">
                    <th className="px-3 py-2 text-left">Block</th>
                    <th className="px-2.5 py-2 text-right">Units</th>
                    <th className="px-2.5 py-2 text-right">Avail</th>
                    <th className="px-2.5 py-2 text-right">Sold</th>
                    <th className="px-2.5 py-2 text-right">% Sold</th>
                    <th className="px-3 py-2 text-right">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {blocks.map((blk) => (
                    <tr
                      key={blk.blockId}
                      className="transition-colors hover:bg-subtle/50"
                    >
                      <td className="px-3 py-2.5 font-medium text-ink">
                        {blk.blockName}
                      </td>
                      <td className="px-2.5 py-2.5 text-right font-sans text-ink tabular-nums">
                        {blk.total}
                      </td>
                      <td className="px-2.5 py-2.5 text-right font-sans text-available tabular-nums">
                        {blk.available}
                      </td>
                      <td className="px-2.5 py-2.5 text-right font-sans text-sold tabular-nums">
                        {blk.sold}
                      </td>
                      <td className="px-2.5 py-2.5 text-right font-sans text-ink tabular-nums">
                        {Math.round(blk.soldPercent)}%
                      </td>
                      <td className="px-3 py-2.5 text-right font-sans text-ink-muted tabular-nums">
                        {formatPkrCompact(blk.totalValuePkr)}
                      </td>
                    </tr>
                  ))}
                  {blocks.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-ink-muted">
                        No blocks configured.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Sales over time chart (visx + motion) */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <div>
                <h2 className="text-[14px] font-semibold text-ink">Sales over time</h2>
                <p className="text-[12px] text-ink-muted">
                  Monthly units closed from status history
                </p>
              </div>
            </div>

            <div className="card overflow-hidden p-4">
              <SalesOverTimeChart data={salesOverTime} />
            </div>
          </section>

          {/* Recent activity list */}
          {canSeeAudit && (
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-2.5">
                <div>
                  <h2 className="text-[14px] font-semibold text-ink">Recent activity</h2>
                  <p className="text-[12px] text-ink-muted">Last 10 audit events</p>
                </div>
                {role === "ADMIN" && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/audit" className="text-[12px]">
                      All logs <ArrowRight weight="light" className="ml-1 size-3" />
                    </Link>
                  </Button>
                )}
              </div>

              <div className="card divide-y divide-line overflow-hidden">
                {activities.length === 0 ? (
                  <p className="p-4 text-center text-[12px] text-ink-muted">
                    No recorded activity yet.
                  </p>
                ) : (
                  activities.map((item) => {
                    const act = humanAction(item.action);
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 text-[12px] transition-colors hover:bg-subtle/50"
                      >
                        <div className="min-w-0 pr-3">
                          <p className="truncate font-medium text-ink">
                            <span className="font-semibold text-primary">
                              {item.actorName}
                            </span>{" "}
                            <span className="text-ink-muted">{act.label}</span>{" "}
                            <span className="unit-code font-mono font-medium text-ink">
                              {item.targetName}
                            </span>
                          </p>
                          <p className="text-[11px] text-ink-faint capitalize">
                            {item.entity}
                          </p>
                        </div>
                        <span className="shrink-0 font-sans text-[11px] text-ink-muted tabular-nums">
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
