import { formatSqft } from "@/lib/area";
import { computeTotalPrice, formatPkrCompact, formatPkrLedger } from "@/lib/money";
import type { InventoryRow, StatusHistoryEntry } from "../types";
import { StatusHistory } from "./status-history";

type UnitReadProps = {
  unit: InventoryRow;
  history?: StatusHistoryEntry[];
};

export function UnitRead({ unit, history = [] }: UnitReadProps) {
  const live = computeTotalPrice(
    unit.ratePerSqftPkr,
    unit.netAreaSqft,
    unit.priceAdjustmentPkr,
  );
  const book = unit.soldPricePkr ?? live;
  const base = computeTotalPrice(unit.ratePerSqftPkr, unit.netAreaSqft, "0");

  return (
    <div className="flex flex-1 flex-col overflow-auto p-4">
      <dl className="space-y-0">
        <Item label="Unit code" value={unit.unitCode} mono />
        <Item label="Unit number" value={unit.unitNumber} />
        <Item label="Floor" value={unit.floorName} />
        <Item label="Category" value={unit.categoryName} />
        <Item label="Net area" value={formatSqft(unit.netAreaSqft)} align="right" />
        <Item label="Gross area" value={formatSqft(unit.grossAreaSqft)} align="right" />
        <Item
          label="Rate / sq ft"
          value={formatPkrLedger(unit.ratePerSqftPkr)}
          align="right"
        />
        <Item label="Ownership group" value={unit.ownershipGroup ?? "—"} />
        <Item label="Sub-owner" value={unit.subOwner ?? "—"} />
        <Item label="Booking ref" value={unit.bookingRef ?? "—"} />
        <Item label="Sellable" value={unit.isSellable ? "Yes" : "No"} />
        <Item label="Status" value={unit.status === "SOLD" ? "Sold" : "Available"} />
        <Item label="Notes" value={unit.notes ?? "—"} />
      </dl>

      <div className="mt-6 border-t border-line pt-4">
        <p className="text-[11px] tracking-wide text-ink-muted">Price breakdown</p>
        <dl className="mt-2 space-y-0">
          <Item
            label={`${formatPkrLedger(unit.ratePerSqftPkr)} × ${unit.netAreaSqft} sq ft`}
            value={formatPkrLedger(base)}
            align="right"
          />
          <Item
            label={
              unit.priceAdjustmentReason
                ? `Adjustment · ${unit.priceAdjustmentReason}`
                : "Adjustment"
            }
            value={formatPkrLedger(unit.priceAdjustmentPkr)}
            align="right"
          />
          <Item
            label={unit.soldPricePkr ? "Sold price (frozen)" : "Asking total"}
            value={formatPkrLedger(book)}
            align="right"
            display
          />
        </dl>
        <p className="mt-1 text-right text-[12px] text-ink-muted">
          {formatPkrCompact(book)}
        </p>
      </div>

      <StatusHistory entries={history} />
    </div>
  );
}

function Item({
  label,
  value,
  align,
  mono,
  display,
}: {
  label: string;
  value: string;
  align?: "right";
  mono?: boolean;
  display?: boolean;
}) {
  return (
    <div className="border-b border-line py-2">
      <dt className="text-[11px] tracking-wide text-ink-muted">{label}</dt>
      <dd
        className={
          display
            ? "font-display text-[22px] tabular-nums"
            : align === "right"
              ? "text-right tabular-nums"
              : mono
                ? "unit-code"
                : undefined
        }
      >
        {value}
      </dd>
    </div>
  );
}
