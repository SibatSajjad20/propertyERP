"use client";

import { DataTable, type InventoryRow } from "@/components/data-table/data-table";
import { formatPkrLedger } from "@/lib/money";

type InventoryPageProps = {
  rows: InventoryRow[];
};

export function InventoryPage({ rows }: InventoryPageProps) {
  const formatted = rows.map((row) => ({
    ...row,
    ratePerSqftPkr: formatPkrLedger(row.ratePerSqftPkr),
    computedPricePkr: formatPkrLedger(row.computedPricePkr),
  }));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-3 flex items-baseline justify-between border-b border-line pb-2">
        <p className="text-[13px] text-ink-muted">
          {rows.length === 1 ? "1 unit" : `${rows.length} units`}
        </p>
        <p className="text-[12px] text-ink-muted">Property / Block / Floor / Unit</p>
      </div>
      <DataTable data={formatted} />
    </div>
  );
}
