/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ClockCountdown,
  MagnifyingGlass,
  Plus,
  Warning,
  CheckCircle,
  XCircle,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/ui/stat-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

export function formatCountdown(expiresAt: Date | string): {
  label: string;
  isExpired: boolean;
  isUrgent: boolean;
} {
  const expiry = new Date(expiresAt).getTime();
  const now = Date.now();
  const diff = expiry - now;

  if (diff <= 0) {
    return { label: "Expired", isExpired: true, isUrgent: false };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const isUrgent = diff < 24 * 60 * 60 * 1000;

  if (days > 0) {
    return { label: `expires in ${days}d ${hours}h`, isExpired: false, isUrgent };
  }
  return { label: `expires in ${hours}h ${minutes}m`, isExpired: false, isUrgent };
}

interface ReservationsScreenProps {
  initialData: {
    rows: Array<{
      id: string;
      status: string;
      startAt: Date;
      expiresAt: Date;
      durationDays: number;
      unitId: string;
      unitCode: string;
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
        description="Hold commercial units for potential buyers with automated deadline expiry."
        actions={
          <Button variant="primary" size="md" asChild>
            <Link href={"/reservations/new" as never}>
              <Plus weight="light" className="mr-1.5 size-4" />
              New reservation
            </Link>
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Active Holds"
          value={initialData.kpi.activeCount}
          caption="units reserved"
          tone="default"
          indicator="accent"
        />
        <StatCard
          label="Expiring Soon"
          value={initialData.kpi.expiringSoonCount}
          caption="within next 24 hours"
          tone={initialData.kpi.expiringSoonCount > 0 ? "sold" : "default"}
          indicator={initialData.kpi.expiringSoonCount > 0 ? "sold" : undefined}
        />
        <StatCard
          label="Converted"
          value={initialData.kpi.convertedCount}
          caption="converted to bookings"
          tone="available"
          indicator="available"
        />
        <StatCard
          label="Cancelled / Expired"
          value={initialData.kpi.cancelledCount}
          caption="released back"
        />
      </div>

      {/* Filter Row */}
      <div className="card flex flex-wrap items-center justify-between gap-3 p-3">
        <div className="relative min-w-[240px] flex-1 sm:max-w-xs">
          <MagnifyingGlass
            weight="light"
            className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-muted"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search unit or client…"
            className="h-9 w-full rounded-[8px] border border-line bg-surface pr-3 pl-8 text-[13px] text-ink transition-colors outline-none placeholder:text-ink-faint focus:border-primary"
          />
        </div>

        <div className="w-[160px]">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="CONVERTED">Converted</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
              <SelectItem value="EXPIRED">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[13px]">
            <thead className="border-b border-line bg-subtle/50 text-ink-muted select-none">
              <tr>
                <th className="px-4 py-2.5 font-medium">Unit</th>
                <th className="px-4 py-2.5 font-medium">Prospective Buyer</th>
                <th className="px-4 py-2.5 font-medium">Start Date</th>
                <th className="px-4 py-2.5 font-medium">Expires At</th>
                <th className="px-4 py-2.5 font-medium">Time Remaining</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-ink-muted">
                    No reservations found.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const countdown = formatCountdown(row.expiresAt);
                  const isEffectiveActive =
                    row.status === "ACTIVE" && !countdown.isExpired;

                  return (
                    <tr
                      key={row.id}
                      onClick={() => router.push(`/reservations/${row.id}` as never)}
                      className="cursor-pointer transition-colors hover:bg-subtle/40"
                    >
                      <td className="px-4 py-3">
                        <span className="unit-code font-mono text-[13px] font-bold text-primary">
                          {row.unitCode}
                        </span>
                        <p className="text-[11px] text-ink-muted">
                          {row.floorName} · {row.blockName}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-ink">{row.clientName}</span>
                        <p className="text-[11px] text-ink-muted tabular-nums">
                          {row.clientPhone}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-sans text-ink tabular-nums">
                        {new Date(row.startAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </td>
                      <td className="px-4 py-3 font-sans text-ink tabular-nums">
                        {new Date(row.expiresAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        {row.status === "ACTIVE" ? (
                          <span
                            className={cn(
                              "font-sans text-[12px] font-medium tabular-nums",
                              countdown.isExpired
                                ? "text-ink-muted"
                                : countdown.isUrgent
                                  ? "font-semibold text-sold"
                                  : "text-accent",
                            )}
                          >
                            {countdown.label}
                          </span>
                        ) : (
                          <span className="text-[11px] text-ink-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {row.status === "ACTIVE" && (
                          <Badge tone={countdown.isExpired ? "muted" : "accent"}>
                            {countdown.isExpired ? "Expired" : "Active"}
                          </Badge>
                        )}
                        {row.status === "CONVERTED" && (
                          <Badge tone="available">Converted</Badge>
                        )}
                        {row.status === "CANCELLED" && (
                          <Badge tone="sold">Cancelled</Badge>
                        )}
                        {row.status === "EXPIRED" && <Badge tone="muted">Expired</Badge>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
