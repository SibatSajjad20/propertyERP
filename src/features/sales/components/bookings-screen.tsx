"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MagnifyingGlass,
  Plus,
  Receipt,
  WarningCircle,
  CurrencyDollar,
  HandCoins,
  CheckCircle,
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
import { formatPkr, formatPkrCompact } from "@/lib/money";
import { cn } from "@/lib/cn";

interface BookingsScreenProps {
  initialData: {
    rows: Array<{
      id: string;
      bookingNo: string;
      status: string;
      listPrice: string;
      netPrice: string;
      downPayment: string;
      paidTotal: string;
      paidPercent: number;
      unitId: string;
      unitCode: string;
      floorName: string;
      blockName: string;
      clientId: string;
      clientName: string;
      clientPhone: string;
      clientCnic: string;
      createdAt: Date;
    }>;
    kpi: {
      activeBookings: number;
      collectedPkr: string;
      outstandingPkr: string;
      overduePkr: string;
    };
  };
}

export function BookingsScreen({ initialData }: BookingsScreenProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [search, setSearch] = React.useState("");

  const filteredRows = React.useMemo(() => {
    return initialData.rows.filter((r) => {
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      if (search.trim()) {
        const term = search.trim().toLowerCase();
        return (
          r.bookingNo.toLowerCase().includes(term) ||
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
        title="Bookings"
        description="Active commercial space bookings, installment plans, and payment ledger."
        actions={
          <Button variant="primary" size="md" asChild>
            <Link href={"/bookings/new" as never}>
              <Plus weight="light" className="mr-1.5 size-4" />
              New booking
            </Link>
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Active Bookings"
          value={initialData.kpi.activeBookings}
          caption="commercial commitments"
          tone="default"
          indicator="accent"
        />
        <StatCard
          label="Collected Total"
          value={formatPkrCompact(initialData.kpi.collectedPkr)}
          caption={formatPkr(initialData.kpi.collectedPkr)}
          tone="available"
          indicator="available"
        />
        <StatCard
          label="Outstanding Balance"
          value={formatPkrCompact(initialData.kpi.outstandingPkr)}
          caption={formatPkr(initialData.kpi.outstandingPkr)}
        />
        <StatCard
          label="Overdue Amount"
          value={formatPkrCompact(initialData.kpi.overduePkr)}
          caption={formatPkr(initialData.kpi.overduePkr)}
          tone={Number(initialData.kpi.overduePkr) > 0 ? "sold" : "default"}
          indicator={Number(initialData.kpi.overduePkr) > 0 ? "sold" : undefined}
        />
      </div>

      {/* Search & Filters */}
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
            placeholder="Search booking no, unit, client…"
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
              <SelectItem value="COMPLETED">Completed (Paid)</SelectItem>
              <SelectItem value="RETURNED">Returned</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
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
                <th className="px-4 py-2.5 font-medium">Booking No</th>
                <th className="px-4 py-2.5 font-medium">Unit</th>
                <th className="px-4 py-2.5 font-medium">Client</th>
                <th className="px-4 py-2.5 text-right font-medium">Net Price</th>
                <th className="w-48 px-4 py-2.5 font-medium">Paid %</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-ink-muted">
                    No bookings found.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => router.push(`/bookings/${row.id}` as never)}
                    className="cursor-pointer transition-colors hover:bg-subtle/40"
                  >
                    <td className="px-4 py-3">
                      <span className="unit-code font-mono text-[13px] font-bold text-primary">
                        {row.bookingNo}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="unit-code font-mono text-[13px] font-semibold text-ink">
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
                    <td className="px-4 py-3 text-right font-medium text-ink tabular-nums">
                      {formatPkr(row.netPrice)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-ink-muted tabular-nums">
                          <span>{formatPkr(row.paidTotal)}</span>
                          <span className="font-semibold text-ink">
                            {row.paidPercent}%
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-subtle">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-300",
                              row.status === "COMPLETED" ? "bg-available" : "bg-primary",
                            )}
                            style={{ width: `${row.paidPercent}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {row.status === "ACTIVE" && (
                        <Badge tone="primary">Active ({row.paidPercent}%)</Badge>
                      )}
                      {row.status === "COMPLETED" && (
                        <Badge tone="available">Completed (Sold)</Badge>
                      )}
                      {row.status === "RETURNED" && <Badge tone="muted">Returned</Badge>}
                      {row.status === "CANCELLED" && <Badge tone="sold">Cancelled</Badge>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
