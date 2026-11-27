"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import type { Route } from "next";
import {
  CaretDown,
  CaretLeft,
  CaretRight,
  Clock,
  MagnifyingGlass,
  SlidersHorizontal,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Pill } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
        className="unit-code font-sans font-medium text-primary tabular-nums hover:underline"
      >
        {label}
      </Link>
    ) : (
      <span className="font-medium text-ink">{label}</span>
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

function getActionTone(
  action: string,
  row: AuditLogRow,
): "blue" | "ok" | "bad" | "dark" | "neutral" {
  if (
    action === "CREATE" ||
    action === "UNIT_CREATED" ||
    (action.includes("PAYMENT") && !action.includes("VOID")) ||
    action.includes("BOOKING")
  ) {
    return "blue";
  }
  if (action === "DELETE" || action.includes("VOID") || action.includes("CANCEL")) {
    return "bad";
  }
  if (action === "SOLD" || row.after?.status === "SOLD") {
    return "dark";
  }
  if (
    action === "REVERSED" ||
    action === "REVERSE_SALE" ||
    (row.after?.status === "AVAILABLE" && row.action === "STATUS_CHANGE")
  ) {
    return "ok";
  }
  return "neutral";
}

export function AuditScreen({ initialResult }: AuditScreenProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
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
    return Array.from(map.values()).sort();
  }, [rows]);

  const actions = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) {
      if (r.action) set.add(r.action);
    }
    return Array.from(set).sort();
  }, [rows]);

  const entities = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) {
      if (r.entity) set.add(r.entity);
    }
    return Array.from(set).sort();
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (actionFilter && r.action !== actionFilter) return false;
      if (userFilter && r.actorName !== userFilter) return false;
      if (entityFilter && r.entity !== entityFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesActor = r.actorName.toLowerCase().includes(query);
        const matchesEntity = (r.entityLabel || r.unitCode || r.entityId)
          .toLowerCase()
          .includes(query);
        const matchesAction = r.action.toLowerCase().includes(query);
        if (!matchesActor && !matchesEntity && !matchesAction) return false;
      }
      return true;
    });
  }, [rows, actionFilter, userFilter, entityFilter, searchQuery]);

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
    const params = new URLSearchParams(
      typeof window !== "undefined" ? window.location.search : "",
    );
    params.set("page", String(newPage));
    router.push(`${pathname}?${params.toString()}` as Route);
  }

  const startEntry = (page - 1) * initialResult.pageSize + 1;
  const endEntry = Math.min(total, page * initialResult.pageSize);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-0 flex-1 flex-col space-y-6">
        <PageHeader
          title="Audit Log"
          description="Immutable record of user actions, status changes, and data mutations."
        />

        {/* Filters Toolbar */}
        <div className="flex flex-col gap-3 rounded-[8px] border border-line bg-surface p-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative w-48">
              <MagnifyingGlass
                weight="regular"
                className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-muted"
                aria-hidden="true"
              />
              <Input
                type="search"
                placeholder="Search events…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8.5 pl-8 text-[12.5px]"
              />
            </div>

            {/* Action Filter */}
            <Select
              value={actionFilter || "all"}
              onValueChange={(val) => setActionFilter(val === "all" ? "" : val)}
            >
              <SelectTrigger
                className="h-8.5 w-[145px] text-[12.5px]"
                aria-label="Filter action"
              >
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
              <SelectTrigger
                className="h-8.5 w-[135px] text-[12.5px]"
                aria-label="Filter entity"
              >
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
              <SelectTrigger
                className="h-8.5 w-[140px] text-[12.5px]"
                aria-label="Filter user"
              >
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

            {(actionFilter || entityFilter || userFilter || searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setActionFilter("");
                  setEntityFilter("");
                  setUserFilter("");
                  setSearchQuery("");
                }}
                className="h-8.5 text-[12px]"
              >
                Reset filters
              </Button>
            )}
          </div>

          <div className="font-sans text-[12px] text-ink-muted">
            Showing <span className="font-semibold text-ink">{filteredRows.length}</span>{" "}
            events on this page
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="overflow-hidden rounded-[8px] border border-line bg-surface">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="h-[38px] border-b border-line bg-[#FAFBFC] text-left text-[11px] font-semibold tracking-wider text-ink-muted uppercase">
                <th className="w-28 px-4">Time</th>
                <th className="w-36 px-4">User</th>
                <th className="w-36 px-4">Action</th>
                <th className="px-4">Summary</th>
                <th className="w-20 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="h-32 text-center text-[13px] text-ink-muted">
                    No audit log entries match these filters.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const expanded = expandedRows.has(row.id);
                  const changes = diffFields(row.before, row.after);
                  const hasDetails =
                    changes.length > 0 || Boolean(row.before) || Boolean(row.after);
                  const tone = getActionTone(row.action, row);

                  return (
                    <tr
                      key={row.id}
                      className="group transition-colors hover:bg-[#F8FAFC]"
                    >
                      <td colSpan={5} className="p-0">
                        <div className="flex h-[44px] items-center px-4">
                          {/* Time */}
                          <div className="w-28 shrink-0">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex items-center gap-1 font-sans text-[12px] text-ink-muted tabular-nums">
                                  <Clock
                                    weight="regular"
                                    className="size-3.5 text-ink-muted"
                                  />
                                  {formatRelativeTime(new Date(row.createdAt), nowMs)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                {formatKarachiDateTime(new Date(row.createdAt))}
                              </TooltipContent>
                            </Tooltip>
                          </div>

                          {/* User */}
                          <div className="w-36 shrink-0 truncate pr-3 font-medium text-ink">
                            {row.actorName}
                          </div>

                          {/* Action Pill */}
                          <div className="w-36 shrink-0 pr-3">
                            <Pill tone={tone} className="truncate">
                              {row.action.replaceAll("_", " ")}
                            </Pill>
                          </div>

                          {/* Summary */}
                          <div className="min-w-0 flex-1 truncate pr-4 text-[13px] text-ink">
                            {renderHumanAction(row)}
                          </div>

                          {/* Diff Button */}
                          <div className="w-20 shrink-0 text-right">
                            {hasDetails ? (
                              <button
                                type="button"
                                onClick={() => toggleRow(row.id)}
                                className="inline-flex cursor-pointer items-center gap-1 rounded-[4px] px-2 py-1 text-[11.5px] font-medium text-ink-muted transition-colors hover:bg-subtle hover:text-ink focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
                              >
                                {expanded ? (
                                  <>
                                    <span>Hide</span>
                                    <CaretDown weight="bold" className="size-3" />
                                  </>
                                ) : (
                                  <>
                                    <span>Diff</span>
                                    <CaretRight weight="bold" className="size-3" />
                                  </>
                                )}
                              </button>
                            ) : null}
                          </div>
                        </div>

                        {/* Expanded Diff Section */}
                        {expanded && hasDetails && (
                          <div className="border-t border-line bg-[#FAFBFC] p-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                              {/* Before Box */}
                              <div className="rounded-[6px] border border-line bg-surface p-3.5 shadow-xs">
                                <div className="mb-2 flex items-center justify-between border-b border-line pb-1.5">
                                  <span className="text-[11px] font-semibold tracking-wider text-ink-muted uppercase">
                                    Before change
                                  </span>
                                  {changes.length > 0 && (
                                    <span className="text-[11px] text-bad">
                                      {changes.length} field
                                      {changes.length === 1 ? "" : "s"} modified
                                    </span>
                                  )}
                                </div>
                                {changes.length > 0 ? (
                                  <div className="space-y-1.5 text-[12px]">
                                    {changes.map((c) => (
                                      <div
                                        key={c.key}
                                        className="flex items-center justify-between rounded bg-bad-soft/40 px-2 py-1"
                                      >
                                        <span className="font-medium text-ink">
                                          {fieldLabel(c.key)}
                                        </span>
                                        <span className="font-sans text-bad tabular-nums">
                                          {formatValue(c.from)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <pre className="overflow-x-auto text-[11px] text-ink-muted">
                                    {JSON.stringify(row.before, null, 2) || "—"}
                                  </pre>
                                )}
                              </div>

                              {/* After Box */}
                              <div className="rounded-[6px] border border-line bg-surface p-3.5 shadow-xs">
                                <div className="mb-2 flex items-center justify-between border-b border-line pb-1.5">
                                  <span className="text-[11px] font-semibold tracking-wider text-ink-muted uppercase">
                                    After change
                                  </span>
                                  {changes.length > 0 && (
                                    <span className="text-[11px] text-ok">
                                      Updated value
                                    </span>
                                  )}
                                </div>
                                {changes.length > 0 ? (
                                  <div className="space-y-1.5 text-[12px]">
                                    {changes.map((c) => (
                                      <div
                                        key={c.key}
                                        className="flex items-center justify-between rounded bg-ok-soft/40 px-2 py-1"
                                      >
                                        <span className="font-medium text-ink">
                                          {fieldLabel(c.key)}
                                        </span>
                                        <span className="font-sans font-medium text-ok tabular-nums">
                                          {formatValue(c.to)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <pre className="overflow-x-auto text-[11px] text-ink-muted">
                                    {JSON.stringify(row.after, null, 2) || "—"}
                                  </pre>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Pagination Footer */}
          <div className="flex items-center justify-between border-t border-line bg-surface px-4 py-3 text-[12.5px] text-ink-muted">
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
                <CaretLeft weight="bold" className="mr-1 size-3" />
                Previous
              </Button>
              <span className="px-1.5 font-sans text-[11.5px] tabular-nums">
                Page {page} of {totalPages || 1}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => goToPage(page + 1)}
              >
                Next
                <CaretRight weight="bold" className="ml-1 size-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
