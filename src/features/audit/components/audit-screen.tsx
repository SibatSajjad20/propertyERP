"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CaretDown, CaretRight, Clock } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { FilterBar, FilterChip } from "@/components/ui/filter-bar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatKarachiDateTime } from "@/lib/datetime";
import type { AuditLogRow } from "../queries";

interface AuditScreenProps {
  initialRows: AuditLogRow[];
}

function formatRelativeTime(date: Date, nowMs: number): string {
  const diff = nowMs - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  email: "Email",
  role: "Role",
  disabled: "Disabled",
  mustChangePassword: "Must change password",
  status: "Status",
  unitCode: "Unit code",
};

function fieldLabel(key: string): string {
  return FIELD_LABELS[key] ?? key.replaceAll("_", " ");
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function diffFields(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
): Array<{ key: string; from: unknown; to: unknown }> {
  const skip = new Set(["id", "change", "password", "updatedAt", "createdAt", "version"]);
  const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
  const changes: Array<{ key: string; from: unknown; to: unknown }> = [];
  for (const key of keys) {
    if (skip.has(key)) continue;
    const from = before?.[key];
    const to = after?.[key];
    if (JSON.stringify(from) === JSON.stringify(to)) continue;
    changes.push({ key, from, to });
  }
  return changes;
}

function renderHumanAction(row: AuditLogRow) {
  const label = row.entityLabel || row.unitCode || row.entityId.slice(0, 8);
  const entityLink =
    row.entity === "unit" ? (
      <Link
        href={`/units/${row.entityId}`}
        className="mx-1 inline-flex items-center gap-1 font-mono font-medium text-primary hover:text-primary-hover hover:underline"
      >
        {label}
      </Link>
    ) : (
      <span className="mx-1 font-medium text-ink">{label}</span>
    );

  if (row.entity === "user") {
    const change = row.after?.change;
    if (row.action === "CREATE") {
      return (
        <span>
          <span className="font-medium text-ink">{row.actorName}</span> created user{" "}
          {entityLink}
          {typeof row.after?.role === "string" ? (
            <span className="text-ink-muted">
              {" "}
              as {String(row.after.role).replaceAll("_", " ").toLowerCase()}
            </span>
          ) : null}
        </span>
      );
    }
    if (change === "role") {
      return (
        <span>
          <span className="font-medium text-ink">{row.actorName}</span> changed role of{" "}
          {entityLink} from {formatValue(row.before?.role)} to{" "}
          {formatValue(row.after?.role)}
        </span>
      );
    }
    if (change === "disabled") {
      return (
        <span>
          <span className="font-medium text-ink">{row.actorName}</span> disabled{" "}
          {entityLink}
        </span>
      );
    }
    if (change === "enabled") {
      return (
        <span>
          <span className="font-medium text-ink">{row.actorName}</span> enabled{" "}
          {entityLink}
        </span>
      );
    }
    if (change === "password_reset" || change === "password") {
      return (
        <span>
          <span className="font-medium text-ink">{row.actorName}</span> reset password for{" "}
          {entityLink}
        </span>
      );
    }
    if (change === "profile_name") {
      return (
        <span>
          <span className="font-medium text-ink">{row.actorName}</span> updated their name
          to {entityLink}
        </span>
      );
    }
  }

  const toStatus = (row.after?.status as string) || (row.after?.toStatus as string);
  if (row.action === "SALE" || toStatus === "SOLD") {
    return (
      <span>
        <span className="font-medium text-ink">{row.actorName}</span> marked {entityLink}{" "}
        as{" "}
        <Badge tone="sold" className="ml-1">
          Sold
        </Badge>
      </span>
    );
  }
  if (
    row.action === "REVERSE_SALE" ||
    (row.action === "STATUS_CHANGE" && toStatus === "AVAILABLE")
  ) {
    return (
      <span>
        <span className="font-medium text-ink">{row.actorName}</span> reversed sale on{" "}
        {entityLink} to{" "}
        <Badge tone="available" className="ml-1">
          Available
        </Badge>
      </span>
    );
  }
  if (row.action === "CREATE") {
    return (
      <span>
        <span className="font-medium text-ink">{row.actorName}</span> created {row.entity}{" "}
        {entityLink}
      </span>
    );
  }
  if (row.action === "UPDATE") {
    return (
      <span>
        <span className="font-medium text-ink">{row.actorName}</span> updated {row.entity}{" "}
        {entityLink}
      </span>
    );
  }
  if (row.action === "DELETE") {
    return (
      <span>
        <span className="font-medium text-ink">{row.actorName}</span> archived{" "}
        {row.entity} {entityLink}
      </span>
    );
  }

  return (
    <span>
      <span className="font-medium text-ink">{row.actorName}</span>{" "}
      {row.action.replaceAll("_", " ").toLowerCase()} {entityLink}
    </span>
  );
}

export function AuditScreen({ initialRows }: AuditScreenProps) {
  const [actionFilter, setActionFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [nowMs] = useState(() => Date.now());

  // Derive unique users and actions for filters
  const users = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of initialRows) {
      if (r.actorName) map.set(r.actorName, r.actorName);
    }
    return Array.from(map.values()).map((name) => ({ id: name, name }));
  }, [initialRows]);

  const actions = useMemo(() => {
    const set = new Set<string>();
    for (const r of initialRows) {
      if (r.action) set.add(r.action);
    }
    return Array.from(set).map((a) => ({
      id: a,
      name: a.replaceAll("_", " "),
    }));
  }, [initialRows]);

  const entities = useMemo(() => {
    const set = new Set<string>();
    for (const r of initialRows) {
      if (r.entity) set.add(r.entity);
    }
    return Array.from(set).map((entity) => ({
      id: entity,
      name: entity.replaceAll("_", " "),
    }));
  }, [initialRows]);

  const dateOptions = [
    { id: "", name: "All time" },
    { id: "today", name: "Today" },
    { id: "7d", name: "Last 7 days" },
    { id: "30d", name: "Last 30 days" },
  ];

  const activeCount =
    (actionFilter ? 1 : 0) +
    (userFilter ? 1 : 0) +
    (entityFilter ? 1 : 0) +
    (dateFilter ? 1 : 0);

  function clearAll() {
    setActionFilter("");
    setUserFilter("");
    setEntityFilter("");
    setDateFilter("");
  }

  function toggleRow(id: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const filtered = useMemo(() => {
    return initialRows.filter((r) => {
      if (actionFilter && r.action !== actionFilter) return false;
      if (userFilter && r.actorName !== userFilter) return false;
      if (entityFilter && r.entity !== entityFilter) return false;
      if (dateFilter) {
        const rowDate = new Date(r.createdAt);
        const diffHours = (nowMs - rowDate.getTime()) / (1000 * 60 * 60);
        if (dateFilter === "today" && diffHours > 24) return false;
        if (dateFilter === "7d" && diffHours > 24 * 7) return false;
        if (dateFilter === "30d" && diffHours > 24 * 30) return false;
      }
      return true;
    });
  }, [initialRows, actionFilter, userFilter, entityFilter, dateFilter, nowMs]);

  return (
    <TooltipProvider>
      <div className="flex min-h-0 flex-1 flex-col space-y-6">
        {/* Header row */}
        <div className="flex flex-col gap-4 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[20px] font-semibold tracking-tight text-ink">
              Audit log
            </h1>
            <p className="mt-0.5 text-[13px] text-ink-muted">
              Forensic record of status transitions, price changes, and structural
              updates.
            </p>
          </div>
          <div className="font-mono text-[12px] text-ink-muted tabular-nums">
            {filtered.length}{" "}
            {filtered.length === 1 ? "event recorded" : "events recorded"}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-line bg-surface p-3">
          <FilterBar activeCount={activeCount} onClearAll={clearAll}>
            <FilterChip
              label="Action"
              value={actionFilter}
              onChange={setActionFilter}
              options={[{ id: "", name: "All actions" }, ...actions]}
            />
            <FilterChip
              label="Staff"
              value={userFilter}
              onChange={setUserFilter}
              options={[{ id: "", name: "All staff" }, ...users]}
            />
            <FilterChip
              label="Entity"
              value={entityFilter}
              onChange={setEntityFilter}
              options={[{ id: "", name: "All entities" }, ...entities]}
            />
            <FilterChip
              label="Period"
              value={dateFilter}
              onChange={setDateFilter}
              options={dateOptions}
            />
          </FilterBar>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-[8px] border border-line bg-surface">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-[13px] text-ink-muted">
              No audit events matched the selected filters.
            </div>
          ) : (
            <div className="divide-y divide-line">
              {filtered.map((row) => {
                const isExpanded = expandedRows.has(row.id);
                const exactTime = formatKarachiDateTime(new Date(row.createdAt));
                const relativeTime = formatRelativeTime(new Date(row.createdAt), nowMs);

                return (
                  <div key={row.id} className="transition-colors hover:bg-subtle/40">
                    <div
                      onClick={() => toggleRow(row.id)}
                      className="flex cursor-pointer items-center justify-between gap-4 px-4 py-3 text-[13px]"
                    >
                      {/* Left: expand caret + human description */}
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <button
                          type="button"
                          aria-label={
                            isExpanded ? "Collapse event" : "Expand event details"
                          }
                          className="flex size-6 shrink-0 items-center justify-center rounded text-ink-muted hover:bg-subtle hover:text-ink"
                        >
                          {isExpanded ? (
                            <CaretDown weight="bold" className="size-3.5" />
                          ) : (
                            <CaretRight weight="bold" className="size-3.5" />
                          )}
                        </button>

                        <div className="min-w-0 flex-1">{renderHumanAction(row)}</div>
                      </div>

                      {/* Right: Timestamp with Tooltip */}
                      <div className="flex shrink-0 items-center gap-3">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex cursor-help items-center gap-1.5 font-mono text-[11px] text-ink-muted tabular-nums">
                              <Clock weight="light" className="size-3.5" />
                              {relativeTime}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <span>Exact: {exactTime} (Karachi PKT)</span>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>

                    {/* Expandable detail row: Raw IDs (mono) & Payload */}
                    {isExpanded && (
                      <div className="animate-slide-down space-y-3 border-t border-line/60 bg-subtle/50 px-6 py-4">
                        <div className="grid grid-cols-1 gap-3 font-mono text-[11px] sm:grid-cols-3">
                          <div>
                            <span className="block text-[10px] font-semibold text-ink-muted uppercase">
                              Audit Event ID
                            </span>
                            <span className="text-ink select-all">{row.id}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] font-semibold text-ink-muted uppercase">
                              Actor ID
                            </span>
                            <span className="text-ink select-all">
                              {row.actorId ?? "system"}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] font-semibold text-ink-muted uppercase">
                              Entity ({row.entity})
                            </span>
                            <span className="text-ink select-all">{row.entityId}</span>
                          </div>
                        </div>

                        {(() => {
                          const changes = diffFields(row.before, row.after);
                          if (changes.length === 0 && !row.before && !row.after) {
                            return null;
                          }
                          if (changes.length === 0) {
                            return (
                              <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
                                {row.before ? (
                                  <pre className="max-h-48 overflow-auto rounded-[4px] border border-line bg-surface p-2.5 font-mono text-[11px] whitespace-pre-wrap text-ink-muted">
                                    {JSON.stringify(row.before, null, 2)}
                                  </pre>
                                ) : null}
                                {row.after ? (
                                  <pre className="max-h-48 overflow-auto rounded-[4px] border border-line bg-surface p-2.5 font-mono text-[11px] whitespace-pre-wrap text-ink-muted">
                                    {JSON.stringify(row.after, null, 2)}
                                  </pre>
                                ) : null}
                              </div>
                            );
                          }
                          return (
                            <div className="space-y-1.5 pt-2">
                              <span className="block text-[10px] font-semibold tracking-wide text-ink-muted uppercase">
                                Changes
                              </span>
                              <div className="divide-y divide-line rounded-[4px] border border-line bg-surface">
                                {changes.map((change) => (
                                  <div
                                    key={change.key}
                                    className="grid grid-cols-1 gap-1 px-2.5 py-2 text-[12px] sm:grid-cols-3"
                                  >
                                    <span className="font-medium text-ink">
                                      {fieldLabel(change.key)}
                                    </span>
                                    <span className="font-mono text-[11px] text-ink-muted">
                                      {formatValue(change.from)}
                                    </span>
                                    <span className="font-mono text-[11px] text-ink">
                                      {formatValue(change.to)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
