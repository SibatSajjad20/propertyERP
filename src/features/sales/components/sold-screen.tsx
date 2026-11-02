/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MagnifyingGlass,
  Plus,
  Tag,
  CurrencyDollar,
  ChartBar,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { formatPkr, formatPkrCompact } from "@/lib/money";

interface SoldScreenProps {
  initialData: {
    rows: Array<{
      id: string;
      saleType: string;
      unitId: string;
      unitCode: string;
      unitNumber: string;
      floorName: string;
      blockName: string;
      categoryName: string;
      clientId: string;
      clientName: string;
      clientPhone: string;
      clientCnic: string;
      pricePkr: string;
      soldAt: Date;
      status: string;
      bookingNo: string | null;
      bookingId: string | null;
    }>;
    kpi: {
      totalSold: number;
      totalVolumePkr: string;
      avgPricePkr: string;
    };
  };
}

export function SoldScreen({ initialData }: SoldScreenProps) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");

  const filteredRows = React.useMemo(() => {
    if (!search.trim()) return initialData.rows;
    const term = search.trim().toLowerCase();
    return initialData.rows.filter(
      (r) =>
        r.unitCode.toLowerCase().includes(term) ||
        r.clientName.toLowerCase().includes(term) ||
        r.clientCnic.toLowerCase().includes(term) ||
        (r.bookingNo && r.bookingNo.toLowerCase().includes(term)),
    );
  }, [initialData.rows, search]);

  return (
    <div className="flex min-h-0 flex-1 flex-col space-y-6">
      <PageHeader
        title="Sold Units"
        description="Completed commercial sales, fully paid bookings, and ownership archive."
        actions={
          <Button variant="primary" size="md" asChild>
            <Link href={"/sold/new" as never}>
              <Plus weight="light" className="mr-1.5 size-4" />
              New direct sale
            </Link>
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Units Sold"
          value={initialData.kpi.totalSold}
          caption="commercial sales"
          tone="sold"
          indicator="sold"
        />
        <StatCard
          label="Total Realized Volume"
          value={formatPkrCompact(initialData.kpi.totalVolumePkr)}
          caption={formatPkr(initialData.kpi.totalVolumePkr)}
          tone="available"
          indicator="available"
        />
        <StatCard
          label="Average Unit Price"
          value={formatPkrCompact(initialData.kpi.avgPricePkr)}
          caption={formatPkr(initialData.kpi.avgPricePkr)}
        />
      </div>

      {/* Search Input */}
      <div className="card p-3">
        <div className="relative max-w-sm">
          <MagnifyingGlass
            weight="light"
            className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-muted"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sold unit, owner, CNIC…"
            className="h-9 w-full rounded-[8px] border border-line bg-surface pr-3 pl-8 text-[13px] text-ink transition-colors outline-none placeholder:text-ink-faint focus:border-primary"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[13px]">
            <thead className="border-b border-line bg-subtle/50 text-ink-muted select-none">
              <tr>
                <th className="px-4 py-2.5 font-medium">Unit</th>
                <th className="px-4 py-2.5 font-medium">Owner</th>
                <th className="px-4 py-2.5 font-medium">Sale Type</th>
                <th className="px-4 py-2.5 text-right font-medium">Sale Price</th>
                <th className="px-4 py-2.5 font-medium">Sold Date</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-ink-muted">
                    No sold units found.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => router.push(`/sold/${row.id}` as never)}
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
                    <td className="px-4 py-3 text-[12px]">
                      {row.saleType === "DIRECT_SALE" ? (
                        <span className="font-medium text-ink">Direct Sale</span>
                      ) : (
                        <div>
                          <span className="font-medium text-ink">Completed Booking</span>
                          {row.bookingNo && (
                            <p className="font-mono text-[11px] text-ink-muted">
                              {row.bookingNo}
                            </p>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-ink tabular-nums">
                      {formatPkr(row.pricePkr)}
                    </td>
                    <td className="px-4 py-3 font-sans text-ink tabular-nums">
                      {new Date(row.soldAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      {row.status === "ACTIVE" ? (
                        <Badge tone="sold">Sold</Badge>
                      ) : (
                        <Badge tone="muted">Bought Back</Badge>
                      )}
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
