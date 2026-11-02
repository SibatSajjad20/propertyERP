"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { Route } from "next";
import { CaretDown, CaretLeft, CaretRight, Clock } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatKarachiDateTime } from "@/lib/datetime";
import type { AuditLogRow, AuditLogResult } from "../queries";

interface AuditScreenProps {
  initialResult: AuditLogResult;
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
  ratePerSqftPkr: "Rate per sq ft",
  soldPricePkr: "Sold price",
  bookingRef: "Booking ref",
  notes: "Notes",
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
      const fromRole = row.before?.role ? String(row.before.role) : null;
      const toRole = row.after?.role ? String(row.after.role) : null;
      return (
        <span>
          <span className="font-medium text-ink">{row.actorName}</span> changed role of{" "}
          {entityLink}
          {fromRole && toRole ? (
            <span className="text-ink-muted">
              {" "}
              from {fromRole.toLowerCase()} to {toRole.toLowerCase()}
            </span>
          ) : null}
        </span>
      );
    }
    if (change === "disabled") {
      const disabled = Boolean(row.after?.disabled);
      return (
        <span>
          <span className="font-medium text-ink">{row.actorName}</span>{" "}
          {disabled ? "deactivated" : "reactivated"} account {entityLink}
        </span>
      );
    }
    if (change === "password_reset") {
      return (
        <span>
          <span className="font-medium text-ink">{row.actorName}</span> reset password for{" "}
          {entityLink}
        </span>
      );
    }
  }

  if (row.entity === "unit") {
    if (row.action === "STATUS_CHANGE") {
      const toStatus = typeof row.after?.status === "string" ? row.after.status : null;
      if (toStatus === "SOLD") {
        return (
          <span>
            <span className="font-medium text-ink">{row.actorName}</span> marked unit{" "}
            {entityLink} as sold
          </span>
        );
      }
      if (toStatus === "AVAILABLE") {
        return (
          <span>
            <span className="font-medium text-ink">{row.actorName}</span> reversed sale of
            unit {entityLink}
          </span>
        );
      }
    }
    if (row.action === "RATE_CHANGE") {
      return (
        <span>
          <span className="font-medium text-ink">{row.actorName}</span> updated rate for
          unit {entityLink}
        </span>
      );
    }
    if (row.action === "CREATE") {
      return (
        <span>
          <span className="font-medium text-ink">{row.actorName}</span> created unit{" "}
          {entityLink}
        </span>
      );
    }
    if (row.action === "UPDATE") {
      return (
        <span>
          <span className="font-medium text-ink">{row.actorName}</span> edited unit{" "}
          {entityLink}
        </span>
      );
    }
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

function actionTone(action: string): "primary" | "available" | "sold" | "muted" {
  if (action === "CREATE" || action === "UNIT_CREATED" || action === "FLOOR_CREATED") {
    return "primary";
  }
  if (action === "SOLD" || action === "DELETE") {
    return "sold";
  }
  if (action === "REVERSED" || action === "REVERSE_SALE") {
    return "available";
  }
  return "muted";
}

function groupRowsByDay(
  rows: AuditLogRow[],
): Array<{ dayLabel: string; rows: AuditLogRow[] }> {
  const groups: Map<string, AuditLogRow[]> = new Map();
  const today = new Date();
  const todayStr = today.toDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  for (const row of rows) {
    const rowDate = new Date(row.createdAt);
    const dateStr = rowDate.toDateString();
    let label = dateStr;
    if (dateStr === todayStr) {
      label = "Today";
    } else if (dateStr === yesterdayStr) {
      label = "Yesterday";
    } else {
      label = rowDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }

    const list = groups.get(label) ?? [];
    list.push(row);
    groups.set(label, list);
  }

  return Array.from(groups.entries()).map(([dayLabel, groupRows]) => ({
    dayLabel,
    rows: groupRows,
  }));
}

export function AuditScreen({ initialResult }: AuditScreenProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [actionFilter, setActionFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [nowMs] = useState(() => Date.now());

  const rows = initialResult.rows;
  const page = initialResult.page;
  const total = initialResult.total;
  const totalPages = initialResult.totalPages;

  // Derive filter options from current rows
  const users = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of rows) {
      if (r.actorName) map.set(r.actorName, r.actorName);
    }
    return Array.from(map.values());
  }, [rows]);

  const actions = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) {
      if (r.action) set.add(r.action);
    }
    return Array.from(set);
  }, [rows]);

  const entities = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) {
      if (r.entity) set.add(r.entity);
    }
    return Array.from(set);
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (actionFilter && r.action !== actionFilter) return false;
      if (userFilter && r.actorName !== userFilter) return false;
      if (entityFilter && r.entity !== entityFilter) return false;
      return true;
    });
  }, [rows, actionFilter, userFilter, entityFilter]);

  const groupedByDay = useMemo(() => {
    return groupRowsByDay(filteredRows);
  }, [filteredRows]);

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

  function goToPage(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`${pathname}?${params.toString()}` as Route);
  }

  const startEntry = (page - 1) * initialResult.pageSize + 1;
  const endEntry = Math.min(total, page * initialResult.pageSize);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6">
        <PageHeader
          title="Audit Log"
          description="Immutable record of user actions, status changes, and data mutations."
        />

        {/* Filters Toolbar */}
        <div className="card flex flex-wrap items-center justify-between gap-3 p-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Action Filter */}
            <Select
              value={actionFilter || "all"}
              onValueChange={(val) => setActionFilter(val === "all" ? "" : val)}
            >
              <SelectTrigger className="w-[160px]" aria-label="Filter action">
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                {actions.map((act) => (
                  <SelectItem key={act} value={act}>
                    {act.replaceAll("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Entity Filter */}
            <Select
              value={entityFilter || "all"}
              onValueChange={(val) => setEntityFilter(val === "all" ? "" : val)}
            >
              <SelectTrigger className="w-[150px]" aria-label="Filter entity">
                <SelectValue placeholder="All entities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All entities</SelectItem>
                {entities.map((ent) => (
                  <SelectItem key={ent} value={ent}>
                    {ent.charAt(0).toUpperCase() + ent.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* User Filter */}
            <Select
              value={userFilter || "all"}
              onValueChange={(val) => setUserFilter(val === "all" ? "" : val)}
            >
              <SelectTrigger className="w-[160px]" aria-label="Filter user">
                <SelectValue placeholder="All users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All users</SelectItem>
                {users.map((usr) => (
                  <SelectItem key={usr} value={usr}>
                    {usr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(actionFilter || entityFilter || userFilter) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setActionFilter("");
                  setEntityFilter("");
                  setUserFilter("");
                }}
              >
                Reset filters
              </Button>
            )}
          </div>

          <div className="text-[12px] text-ink-muted">
            Showing <span className="font-semibold text-ink">{filteredRows.length}</span>{" "}
            events on this page
          </div>
        </div>

        {/* Day Grouped List */}
        <div className="card overflow-hidden">
          {groupedByDay.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-[13px] text-ink-muted">
              No audit log entries match these filters.
            </div>
          ) : (
            <div>
              {groupedByDay.map(({ dayLabel, rows: dayRows }) => (
                <div key={dayLabel} className="border-b border-line last:border-b-0">
                  {/* Day Header */}
                  <div className="bg-surface-elevated/90 sticky top-0 z-10 border-y border-line px-4 py-1.5 text-[11px] font-semibold tracking-wider text-ink-muted uppercase backdrop-blur-xs">
                    {dayLabel} · {dayRows.length} event{dayRows.length === 1 ? "" : "s"}
                  </div>

                  {/* Day Rows */}
                  <div className="divide-y divide-line/60">
                    {dayRows.map((row) => {
                      const expanded = expandedRows.has(row.id);
                      const changes = diffFields(row.before, row.after);
                      const hasDetails =
                        changes.length > 0 || Boolean(row.before) || Boolean(row.after);

                      return (
                        <div
                          key={row.id}
                          className="group hover:bg-surface-hover p-3 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5">
                              {/* Action Badge */}
                              <Badge tone={actionTone(row.action)} className="mt-0.5">
                                {row.action.replaceAll("_", " ")}
                              </Badge>

                              {/* Human Readable Action */}
                              <div className="text-[13px] text-ink">
                                {renderHumanAction(row)}
                              </div>
                            </div>

                            {/* Timestamp & Expand trigger */}
                            <div className="flex shrink-0 items-center gap-3">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="flex items-center gap-1 text-[11px] text-ink-muted tabular-nums">
                                    <Clock weight="light" className="size-3" />
                                    {formatRelativeTime(new Date(row.createdAt), nowMs)}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                  {formatKarachiDateTime(new Date(row.createdAt))}
                                </TooltipContent>
                              </Tooltip>

                              {hasDetails && (
                                <button
                                  type="button"
                                  onClick={() => toggleRow(row.id)}
                                  className="flex cursor-pointer items-center gap-1 rounded-[4px] px-1.5 py-0.5 text-[11px] text-ink-muted transition-colors hover:bg-subtle hover:text-ink"
                                >
                                  {expanded ? (
                                    <>
                                      <span>Hide</span>
                                      <CaretDown weight="light" className="size-3" />
                                    </>
                                  ) : (
                                    <>
                                      <span>Diff</span>
                                      <CaretRight weight="light" className="size-3" />
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Expanded Diff View */}
                          {expanded && hasDetails && (
                            <div className="mt-3 rounded-[6px] border border-line bg-subtle/50 p-3 text-[12px]">
                              {changes.length > 0 ? (
                                <div className="space-y-1.5">
                                  <p className="font-semibold text-ink-muted">
                                    Changed fields:
                                  </p>
                                  <div className="grid grid-cols-1 gap-1">
                                    {changes.map((c) => (
                                      <div
                                        key={c.key}
                                        className="flex items-center gap-2 font-mono text-[11px]"
                                      >
                                        <span className="font-medium text-ink">
                                          {fieldLabel(c.key)}:
                                        </span>
                                        <span className="text-sold line-through">
                                          {formatValue(c.from)}
                                        </span>
                                        <span className="text-ink-muted">→</span>
                                        <span className="text-available">
                                          {formatValue(c.to)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="grid grid-cols-2 gap-4 font-mono text-[10px]">
                                  <div>
                                    <p className="font-semibold text-ink-muted">
                                      Before:
                                    </p>
                                    <pre className="mt-1 overflow-x-auto rounded bg-surface p-2 text-ink">
                                      {JSON.stringify(row.before, null, 2)}
                                    </pre>
                                  </div>
                                  <div>
                                    <p className="font-semibold text-ink-muted">After:</p>
                                    <pre className="mt-1 overflow-x-auto rounded bg-surface p-2 text-ink">
                                      {JSON.stringify(row.after, null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Footer (50 / page) */}
          <div className="flex items-center justify-between border-t border-line bg-surface p-3 text-[12px] text-ink-muted">
            <span>
              Showing{" "}
              <span className="font-semibold text-ink">{total > 0 ? startEntry : 0}</span>{" "}
              to <span className="font-semibold text-ink">{endEntry}</span> of{" "}
              <span className="font-semibold text-ink">{total}</span> total entries
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => goToPage(page - 1)}
              >
                <CaretLeft weight="light" className="mr-1 size-3.5" />
                Previous
              </Button>
              <span className="px-1 text-[11px] tabular-nums">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => goToPage(page + 1)}
              >
                Next
                <CaretRight weight="light" className="ml-1 size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
