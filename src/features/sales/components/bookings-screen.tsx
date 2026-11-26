"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MagnifyingGlass, Plus } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { StatStrip, StatCell } from "@/components/ui/stat-strip";
import { Panel } from "@/components/ui/panel";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Pill } from "@/components/ui/badge";
import { formatPkr, formatPkrCompact } from "@/lib/money";
import { cn } from "@/lib/cn";

interface BookingsScreenProps {
  initialData: {
    rows: Array<{
      id: string;
      bookingNo: string;
      serialNo: number;
      applicationFormNo: string;
      registrationNo: string;
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
          String(r.serialNo).includes(term) ||
          r.applicationFormNo.toLowerCase().includes(term) ||
          r.registrationNo.toLowerCase().includes(term) ||
          r.unitCode.toLowerCase().includes(term) ||
          r.clientName.toLowerCase().includes(term) ||
          r.clientCnic.toLowerCase().includes(term) ||
          r.clientPhone.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [initialData.rows, statusFilter, search]);

  const overdueVal = Number(initialData.kpi.overduePkr) || 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col space-y-6">
      <PageHeader
        title="Bookings"
        meta={[
          `${initialData.kpi.activeBookings} active`,
          `${initialData.rows.length} total recorded`,
        ]}
        actions={
          <Button variant="primary" size="md" asChild>
            <Link href={"/bookings/new" as never}>
              <Plus weight="light" className="mr-1.5 size-4" />
              New booking
            </Link>
          </Button>
        }
      />

      {/* StatStrip from existing KPIs */}
      <StatStrip columns={4} className="mb-0">
        <StatCell
          label="Active Bookings"
          value={initialData.kpi.activeBookings}
          suffix="units"
          subLine="Commercial commitments"
        />
        <StatCell
          label="Collected Total"
          value={formatPkrCompact(initialData.kpi.collectedPkr)}
          prefixRs
          subLine={formatPkr(initialData.kpi.collectedPkr)}
        />
        <StatCell
          label="Outstanding Balance"
          value={formatPkrCompact(initialData.kpi.outstandingPkr)}
          prefixRs
          subLine={formatPkr(initialData.kpi.outstandingPkr)}
        />
        <StatCell
          label="Overdue Amount"
          value={formatPkrCompact(initialData.kpi.overduePkr)}
          prefixRs
          valueClassName={overdueVal > 0 ? "text-bad" : "text-good"}
          subLine={
            overdueVal > 0 ? formatPkr(initialData.kpi.overduePkr) : "Nothing overdue"
          }
        />
      </StatStrip>

      {/* Table Panel */}
      <Panel bodyClassName="p-0 overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-3">
          <div className="relative min-w-[240px] flex-1 sm:max-w-xs">
            <MagnifyingGlass
              weight="light"
              className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search serial, form no, unit, client…"
              className="h-9 w-full rounded-[6px] border border-border bg-surface pr-3 pl-8 text-[12.5px] text-ink transition-colors outline-none placeholder:text-subtle focus:border-primary"
            />
          </div>

          <SegmentedControl
            value={statusFilter}
            onValueChange={setStatusFilter}
            size="sm"
            options={[
              { value: "ALL", label: `All (${initialData.rows.length})` },
              {
                value: "ACTIVE",
                label: `Active (${
                  initialData.rows.filter((r) => r.status === "ACTIVE").length
                })`,
              },
              {
                value: "COMPLETED",
                label: `Completed (${
                  initialData.rows.filter((r) => r.status === "COMPLETED").length
                })`,
              },
              {
                value: "RETURNED",
                label: `Returned (${
                  initialData.rows.filter((r) => r.status === "RETURNED").length
                })`,
              },
              {
                value: "CANCELLED",
                label: `Cancelled (${
                  initialData.rows.filter((r) => r.status === "CANCELLED").length
                })`,
              },
            ]}
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[13px]">
            <thead className="border-b border-line bg-[#FAFBFC] text-[12px] font-medium text-muted select-none">
              <tr className="h-[38px]">
                <th className="px-4 font-medium">Serial / Form No</th>
                <th className="px-4 font-medium">Unit</th>
                <th className="px-4 font-medium">Client</th>
                <th className="px-4 text-right font-medium">Net Price</th>
                <th className="w-48 px-4 font-medium">Paid %</th>
                <th className="px-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-muted">
                    No bookings found.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => router.push(`/bookings/${row.id}` as never)}
                    className="h-11 cursor-pointer transition-colors hover:bg-subtle/50"
                  >
                    <td className="px-4 py-2">
                      <span className="font-sans text-[13px] font-semibold text-primary tabular-nums">
                        #{row.serialNo}
                      </span>
                      <p className="font-sans text-[11px] text-muted tabular-nums">
                        {row.applicationFormNo}
                      </p>
                    </td>
                    <td className="px-4 py-2">
                      <span className="font-sans text-[13px] font-medium text-ink">
                        {row.unitCode}
                      </span>
                      <p className="text-[11px] text-muted">
                        {row.floorName} · {row.blockName}
                      </p>
                    </td>
                    <td className="px-4 py-2">
                      <span className="font-medium text-ink">{row.clientName}</span>
                      <p className="text-[11px] text-muted tabular-nums">
                        {row.clientCnic || row.clientPhone}
                      </p>
                    </td>
                    <td className="px-4 py-2 text-right font-semibold text-ink tabular-nums">
                      {formatPkr(row.netPrice)}
                    </td>
                    <td className="px-4 py-2">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-muted tabular-nums">
                          <span>{formatPkrCompact(row.paidTotal)}</span>
                          <span className="font-semibold text-ink">
                            {row.paidPercent}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#EDF0F3]">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-300",
                              row.status === "COMPLETED" ? "bg-good" : "bg-primary",
                            )}
                            style={{
                              width: `${Math.min(100, Math.max(0, row.paidPercent))}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      {row.status === "ACTIVE" && <Pill tone="primary">Active</Pill>}
                      {row.status === "COMPLETED" && (
                        <Pill tone="available">Completed</Pill>
                      )}
                      {row.status === "RETURNED" && <Pill tone="muted">Returned</Pill>}
                      {row.status === "CANCELLED" && <Pill tone="sold">Cancelled</Pill>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
