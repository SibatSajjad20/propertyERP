import { formatSqft } from "@/lib/area";
import { computeTotalPrice, formatPkrCompact, formatPkrLedger } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import type { InventoryRow, StatusHistoryEntry } from "../types";
import { StatusHistory } from "./status-history";

interface UnitReadProps {
  unit: InventoryRow;
  history?: StatusHistoryEntry[];
}

export function UnitRead({ unit, history = [] }: UnitReadProps) {
  const live = computeTotalPrice(
    unit.ratePerSqftPkr,
    unit.netAreaSqft,
    unit.priceAdjustmentPkr,
  );
  const book = unit.soldPricePkr ?? live;
  const base = computeTotalPrice(unit.ratePerSqftPkr, unit.netAreaSqft, "0");

  return (
    <div className="flex flex-1 flex-col space-y-6 overflow-y-auto px-5 py-4">
      {/* Status banner */}
      <div className="flex items-center justify-between rounded-[8px] border border-line bg-subtle/50 px-4 py-3">
        <div>
          <p className="text-[11px] font-medium tracking-wider text-ink-muted uppercase">
            Current Status
          </p>
          <div className="mt-1">
            <Badge tone={unit.status === "SOLD" ? "sold" : "available"}>
              {unit.status === "SOLD" ? "Sold" : "Available"}
            </Badge>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-medium tracking-wider text-ink-muted uppercase">
            {unit.soldPricePkr ? "Frozen Sold Price" : "Total Asking"}
          </p>
          <p className="price mt-0.5 font-sans text-[16px] font-semibold text-ink tabular-nums">
            {formatPkrLedger(book)}
          </p>
        </div>
      </div>

      {/* Identity & Structure */}
      <section className="space-y-2">
        <p className="border-b border-line pb-1 text-[11px] font-semibold tracking-wider text-ink-muted uppercase">
          Identity &amp; Location
        </p>
        <dl className="divide-y divide-line/60">
          <Row label="Unit code" value={unit.unitCode} mono />
          <Row label="Unit number" value={unit.unitNumber} />
          <Row label="Floor" value={unit.floorName} />
          <Row label="Category" value={unit.categoryName} />
          <Row label="Sellable inventory" value={unit.isSellable ? "Yes" : "No"} />
        </dl>
      </section>

      {/* Area & Valuation */}
      <section className="space-y-2">
        <p className="border-b border-line pb-1 text-[11px] font-semibold tracking-wider text-ink-muted uppercase">
          Area &amp; Valuation
        </p>
        <dl className="divide-y divide-line/60">
          <Row label="Net area" value={formatSqft(unit.netAreaSqft)} />
          <Row label="Gross area" value={formatSqft(unit.grossAreaSqft)} />
          <Row label="Rate per sq ft" value={formatPkrLedger(unit.ratePerSqftPkr)} />
          <Row
            label={`Base valuation (${unit.ratePerSqftPkr} × ${unit.netAreaSqft})`}
            value={formatPkrLedger(base)}
          />
          <Row
            label={
              unit.priceAdjustmentReason
                ? `Adjustment · ${unit.priceAdjustmentReason}`
                : "Adjustment"
            }
            value={formatPkrLedger(unit.priceAdjustmentPkr)}
          />
          <Row
            label={unit.soldPricePkr ? "Sold price (frozen)" : "Total calculated"}
            value={formatPkrLedger(book)}
            highlight
          />
        </dl>
        <p className="price text-right font-sans text-[11px] text-ink-muted tabular-nums">
          {formatPkrCompact(book)}
        </p>
      </section>

      {/* Ownership & Booking */}
      <section className="space-y-2">
        <p className="border-b border-line pb-1 text-[11px] font-semibold tracking-wider text-ink-muted uppercase">
          Ownership &amp; Booking
        </p>
        <dl className="divide-y divide-line/60">
          <Row label="Ownership group" value={unit.ownershipGroup ?? "—"} />
          <Row label="Sub-owner" value={unit.subOwner ?? "—"} />
          <Row
            label="Booking ref"
            value={unit.bookingRef ?? "—"}
            mono={Boolean(unit.bookingRef)}
          />
          {unit.soldAt ? (
            <Row label="Sold at" value={new Date(unit.soldAt).toLocaleString()} />
          ) : null}
          {unit.notes ? <Row label="Notes" value={unit.notes} /> : null}
        </dl>
      </section>

      {/* History timeline */}
      <section className="space-y-2">
        <p className="border-b border-line pb-1 text-[11px] font-semibold tracking-wider text-ink-muted uppercase">
          Status &amp; Valuation History
        </p>
        <StatusHistory entries={history} />
      </section>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
  highlight,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2 text-[13px]">
      <dt className="font-normal text-ink-muted">{label}</dt>
      <dd
        className={
          highlight
            ? "font-sans text-[15px] font-semibold text-ink tabular-nums"
            : mono
              ? "unit-code font-mono text-ink"
              : "font-sans text-ink tabular-nums"
        }
      >
        {value}
      </dd>
    </div>
  );
}
