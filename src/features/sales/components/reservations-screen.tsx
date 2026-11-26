/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Hourglass, MagnifyingGlass, Plus, Receipt } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { StatStrip, StatCell } from "@/components/ui/stat-strip";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Badge, Pill } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { formatUnitDisplayCode } from "@/lib/area";
import { formatPkr, parseDecimal } from "@/lib/money";
import { cn } from "@/lib/cn";

export function formatCountdown(
  expiresAt: Date | string,
  durationDays = 7,
): {
  label: string;
  isExpired: boolean;
  isUrgent: boolean;
  percentRemaining: number;
} {
  const expiry = new Date(expiresAt).getTime();
  const now = Date.now();
  const diff = expiry - now;

  if (diff <= 0) {
    return {
      label: "Expired",
      isExpired: true,
      isUrgent: false,
      percentRemaining: 0,
    };
  }

  const totalDurationMs = durationDays * 24 * 60 * 60 * 1000;
  const percentRemaining = Math.max(
    0,
    Math.min(100, Math.round((diff / (totalDurationMs || 1)) * 100)),
  );

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const isUrgent = diff < 24 * 60 * 60 * 1000;

  if (days > 0) {
    return {
      label: `${days}d ${hours}h`,
      isExpired: false,
      isUrgent,
      percentRemaining,
    };
  }
  return {
    label: `${hours}h ${minutes}m`,
    isExpired: false,
    isUrgent,
    percentRemaining,
  };
}

interface ReservationsScreenProps {
  initialData: {
    rows: Array<{
      id: string;
      status: string;
      startAt: Date;
      expiresAt: Date;
      durationDays: number;
      tokenAmount?: string;
      tokenReceiptNo?: string | null;
      tokenAdjustedToBookingId?: string | null;
      unitId: string;
      unitCode: string;
      categoryName?: string;
      floorName: string;
      blockName: string;
      clientId: string;
      clientName: string;
      clientPhone: string;
      clientCnic: string;
      createdByName: string | null;
    }>;
    kpi: {
      activeCount: number;
      expiringSoonCount: number;
      convertedCount: number;
      cancelledCount: number;
    };
  };
}

export function ReservationsScreen({ initialData }: ReservationsScreenProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [search, setSearch] = React.useState("");

  const filteredRows = React.useMemo(() => {
    return initialData.rows.filter((r) => {
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      if (search.trim()) {
        const term = search.trim().toLowerCase();
        return (
          r.unitCode.toLowerCase().includes(term) ||
          r.clientName.toLowerCase().includes(term) ||
          r.clientCnic.toLowerCase().includes(term) ||
          r.clientPhone.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [initialData.rows, statusFilter, search]);

  return (
    <div className="flex min-h-0 flex-1 flex-col space-y-6">
      <PageHeader
        title="Reservations"
        meta={[
          `${initialData.kpi.activeCount} active holds`,
          `${initialData.rows.length} total`,
        ]}
        actions={
          <Button variant="primary" size="md" asChild className="gap-1.5">
            <Link href={"/reservations/new" as never}>
              <Plus weight="bold" className="size-4" />
              New reservation
            </Link>
          </Button>
        }
      />

      {/* 4-Cell StatStrip */}
      <StatStrip columns={4}>
        <StatCell
          label="ACTIVE HOLDS"
          value={initialData.kpi.activeCount}
          subLine="units reserved"
        />
        <StatCell
          label="EXPIRING SOON"
          value={initialData.kpi.expiringSoonCount}
          valueClassName={initialData.kpi.expiringSoonCount > 0 ? "text-sold" : undefined}
          subLine="within next 24 hours"
        />
        <StatCell
          label="CONVERTED"
          value={initialData.kpi.convertedCount}
          subLine="converted to bookings"
        />
        <StatCell
          label="CANCELLED / EXPIRED"
          value={initialData.kpi.cancelledCount}
          subLine="released back"
        />
      </StatStrip>

      {/* Table Panel with Toolbar */}
      <Panel className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface p-3">
          <div className="relative min-w-[240px] flex-1 sm:max-w-xs">
            <MagnifyingGlass
              weight="light"
              className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-muted"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search unit, buyer, CNIC, phone…"
              className="h-8.5 w-full rounded-[8px] border border-line bg-subtle/30 pr-3 pl-8 text-[12.5px] text-ink outline-none placeholder:text-ink-faint focus:border-primary focus:bg-surface"
            />
          </div>

          <SegmentedControl
            options={[
              { value: "ALL", label: "All" },
              { value: "ACTIVE", label: "Active" },
              { value: "CONVERTED", label: "Converted" },
              { value: "CANCELLED", label: "Cancelled" },
              { value: "EXPIRED", label: "Expired" },
            ]}
            value={statusFilter}
            onValueChange={setStatusFilter}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[13px]">
            <thead>
              <tr className="h-[38px] border-b border-line bg-[#FAFBFC] text-[12px] font-medium text-ink-muted select-none">
                <th className="px-4 font-medium">Unit</th>
                <th className="px-4 font-medium">Prospective Buyer</th>
                <th className="px-4 font-medium">Start Date</th>
                <th className="px-4 font-medium">Expires At</th>
                <th className="px-4 font-medium">Time Remaining</th>
                <th className="px-4 font-medium">Status</th>
                <th className="px-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-ink-muted">
                    No reservations found.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const countdown = formatCountdown(row.expiresAt, row.durationDays);
                  const isRowActive = row.status === "ACTIVE" && !countdown.isExpired;

                  return (
                    <tr
                      key={row.id}
                      className="h-[44px] transition-colors hover:bg-subtle/30"
                    >
                      <td className="px-4 py-2">
                        <Link
                          href={`/reservations/${row.id}`}
                          className="font-sans text-[13px] font-medium text-ink hover:text-primary"
                        >
                          {formatUnitDisplayCode(row.unitCode, row.categoryName)}
                        </Link>
                        <p className="text-[11px] text-ink-muted">
                          {row.floorName} · {row.blockName}
                        </p>
                      </td>
                      <td className="px-4 py-2">
                        <span className="font-medium text-ink">{row.clientName}</span>
                        <p className="text-[11px] text-ink-muted tabular-nums">
                          {row.clientPhone}
                        </p>
                      </td>
                      <td className="px-4 py-2 font-sans text-ink tabular-nums">
                        {new Date(row.startAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </td>
                      <td className="px-4 py-2 font-sans text-ink tabular-nums">
                        {new Date(row.expiresAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-2">
                        {row.status === "ACTIVE" ? (
                          <div className="flex items-center gap-2">
                            <div className="h-1 w-16 overflow-hidden rounded-full bg-[#EDF0F3]">
                              <div
                                className={cn(
                                  "h-full transition-all duration-300",
                                  countdown.percentRemaining < 15
                                    ? "bg-sold"
                                    : "bg-primary",
                                )}
                                style={{
                                  width: `${Math.min(100, Math.max(0, countdown.percentRemaining))}%`,
                                }}
                              />
                            </div>
                            <span
                              className={cn(
                                "font-sans text-[12px] font-medium tabular-nums",
                                countdown.isUrgent
                                  ? "font-semibold text-sold"
                                  : "text-ink",
                              )}
                            >
                              {countdown.label}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-ink-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {row.status === "ACTIVE" && (
                          <Pill tone={countdown.isExpired ? "muted" : "accent"}>
                            {countdown.isExpired ? "Expired" : "Active Hold"}
                          </Pill>
                        )}
                        {row.status === "CONVERTED" && (
                          <Pill tone="available">Converted</Pill>
                        )}
                        {row.status === "CANCELLED" && <Pill tone="sold">Cancelled</Pill>}
                        {row.status === "EXPIRED" && <Pill tone="muted">Expired</Pill>}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {isRowActive ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="secondary"
                              size="sm"
                              asChild
                              className="h-7 text-[12px]"
                            >
                              <Link href={`/reservations/${row.id}`}>Extend</Link>
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              asChild
                              className="h-7 text-[12px]"
                            >
                              <Link
                                href={
                                  `/bookings/new?unitId=${row.unitId}&clientId=${row.clientId}&reservationId=${row.id}` as never
                                }
                              >
                                Convert
                              </Link>
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            asChild
                            className="h-7 text-[12px]"
                          >
                            <Link href={`/reservations/${row.id}`}>View</Link>
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
