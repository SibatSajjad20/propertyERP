"use client";

import Link from "next/link";
import { ArrowRight, Plus } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
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
  stats,
  floors,
  blocks,
  salesOverTime,
  activities,
  filterOptions,
  selectedPropertyId,
  selectedBlockId,
  role,
  canManage,
}: DashboardScreenProps) {
  const canSeeAudit = role !== "SALES";

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
                <Link href="/inventory?mode=create">
                  <Plus weight="light" className="mr-1.5 size-3.5" />
                  New unit
                </Link>
              </Button>
            )}
          </>
        }
      />

      {/* KPI Strip: 6 metrics separated by vertical hairlines */}
      <div className="grid grid-cols-2 divide-y divide-line overflow-hidden rounded-[8px] border border-line bg-surface md:grid-cols-3 md:divide-x md:divide-y-0 lg:grid-cols-6">
        {/* 1. Total units */}
        <div className="kpi flex flex-col justify-between p-4 sm:p-5">
          <p className="text-[11px] font-medium tracking-wider text-ink-muted uppercase">
            Total units
          </p>
          <div className="mt-3">
            <span className="font-mono text-[26px] leading-none font-medium text-ink tabular-nums sm:text-[28px]">
              {stats.total}
            </span>
            <p className="mt-1 text-[11px] text-ink-muted">catalogued</p>
          </div>
        </div>

        {/* 2. Available */}
        <div className="kpi flex flex-col justify-between p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium tracking-wider text-ink-muted uppercase">
              Available
            </p>
            <span className="size-2 rounded-full bg-available" aria-hidden="true" />
          </div>
          <div className="mt-3">
            <span className="font-mono text-[26px] leading-none font-medium text-available tabular-nums sm:text-[28px]">
              {stats.available}
            </span>
            <p className="mt-1 font-mono text-[11px] text-ink-muted tabular-nums">
              {stats.total > 0
                ? `${Math.round((stats.available / stats.total) * 100)}%`
                : "0%"}{" "}
              in inventory
            </p>
          </div>
        </div>

        {/* 3. Sold */}
        <div className="kpi flex flex-col justify-between p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium tracking-wider text-ink-muted uppercase">
              Sold
            </p>
            <span className="size-2 rounded-full bg-sold" aria-hidden="true" />
          </div>
          <div className="mt-3">
            <span className="font-mono text-[26px] leading-none font-medium text-sold tabular-nums sm:text-[28px]">
              {stats.sold}
            </span>
            <p className="mt-1 font-mono text-[11px] text-ink-muted tabular-nums">
              {stats.total > 0
                ? `${Math.round((stats.sold / stats.total) * 100)}%`
                : "0%"}{" "}
              closed
            </p>
          </div>
        </div>

        {/* 4. % Sold */}
        <div className="kpi flex flex-col justify-between p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium tracking-wider text-ink-muted uppercase">
              % Sold
            </p>
            <span className="size-2 rounded-full bg-accent/60" aria-hidden="true" />
          </div>
          <div className="mt-3">
            <span className="font-mono text-[26px] leading-none font-medium text-ink tabular-nums sm:text-[28px]">
              {stats.soldPercent.toFixed(1)}%
            </span>
            <p className="mt-1 text-[11px] text-ink-muted">absorption rate</p>
          </div>
        </div>

        {/* 5. Available inventory value (area x rate) */}
        <div className="kpi flex flex-col justify-between p-4 sm:p-5">
          <p className="text-[11px] font-medium tracking-wider text-ink-muted uppercase">
            Available value
          </p>
          <div className="mt-3">
            <span className="font-mono text-[24px] leading-none font-medium text-ink tabular-nums sm:text-[26px]">
              {formatPkrCompact(stats.availableValuePkr)}
            </span>
            <p
              className="mt-1 truncate font-mono text-[11px] text-ink-muted tabular-nums"
              title={formatPkrLedger(stats.availableValuePkr)}
            >
              area × rate
            </p>
          </div>
        </div>

        {/* 6. Total sold value (PKR) */}
        <div className="kpi flex flex-col justify-between p-4 sm:p-5">
          <p className="text-[11px] font-medium tracking-wider text-ink-muted uppercase">
            Sold value
          </p>
          <div className="mt-3">
            <span className="font-mono text-[24px] leading-none font-medium text-ink tabular-nums sm:text-[26px]">
              {formatPkrCompact(stats.soldValuePkr)}
            </span>
            <p
              className="mt-1 truncate font-mono text-[11px] text-ink-muted tabular-nums"
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
            <div className="rounded-[8px] border border-line bg-surface p-6 text-center text-[13px] text-ink-muted">
              No floors match the current filters.
            </div>
          ) : (
            <div className="divide-y divide-line overflow-hidden rounded-[8px] border border-line bg-surface">
              {floors.map((fl) => {
                const soldPct = fl.total > 0 ? (fl.sold / fl.total) * 100 : 0;
                const availPct = fl.total > 0 ? (fl.available / fl.total) * 100 : 0;
                return (
                  <Link
                    key={fl.floorId}
                    href={`/inventory?floor=${fl.floorId}`}
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

                    {/* Proportional bar (available vs sold) */}
                    <div className="mx-2 min-w-0 flex-1">
                      <div className="flex h-2 w-full overflow-hidden rounded-full border border-line/60 bg-subtle">
                        {soldPct > 0 && (
                          <div
                            style={{ width: `${soldPct}%` }}
                            className="h-full bg-sold transition-all duration-300"
                            title={`Sold: ${fl.sold} (${Math.round(soldPct)}%)`}
                          />
                        )}
                        {availPct > 0 && (
                          <div
                            style={{ width: `${availPct}%` }}
                            className="h-full bg-available transition-all duration-300"
                            title={`Available: ${fl.available} (${Math.round(availPct)}%)`}
                          />
                        )}
                      </div>
                    </div>

                    {/* Sold / total and value right-aligned in mono numbers */}
                    <div className="w-36 shrink-0 text-right">
                      <div className="font-mono text-[13px] text-ink tabular-nums">
                        <span>{fl.sold}</span>
                        <span className="font-mono text-[12px] text-ink-muted">
                          {" "}
                          / {fl.total}
                        </span>
                        <span className="ml-1 text-[11px] text-ink-muted tabular-nums">
                          ({Math.round(soldPct)}%)
                        </span>
                      </div>
                      <p className="font-mono text-[11px] text-ink-muted tabular-nums">
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

            <div className="overflow-hidden rounded-[8px] border border-line bg-surface">
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
                      <td className="px-2.5 py-2.5 text-right font-mono text-ink tabular-nums">
                        {blk.total}
                      </td>
                      <td className="px-2.5 py-2.5 text-right font-mono text-available tabular-nums">
                        {blk.available}
                      </td>
                      <td className="px-2.5 py-2.5 text-right font-mono text-sold tabular-nums">
                        {blk.sold}
                      </td>
                      <td className="px-2.5 py-2.5 text-right font-mono text-ink tabular-nums">
                        {Math.round(blk.soldPercent)}%
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-ink-muted tabular-nums">
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

          {/* Sales over time chart (visx) */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <div>
                <h2 className="text-[14px] font-semibold text-ink">Sales over time</h2>
                <p className="text-[12px] text-ink-muted">
                  Monthly units closed from status history
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-[8px] border border-line bg-surface p-4">
              <SalesOverTimeChart data={salesOverTime} />
            </div>
          </section>

          {/* Recent activity list (only rendered if user role is not SALES) */}
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

              <div className="divide-y divide-line overflow-hidden rounded-[8px] border border-line bg-surface">
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
                            <span className="font-mono font-medium text-ink">
                              {item.targetName}
                            </span>
                          </p>
                          <p className="text-[11px] text-ink-faint capitalize">
                            {item.entity}
                          </p>
                        </div>
                        <span className="shrink-0 font-mono text-[11px] text-ink-muted tabular-nums">
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
