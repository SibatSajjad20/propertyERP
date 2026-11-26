import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PencilSimple } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { StatStrip, StatCell } from "@/components/ui/stat-strip";
import { Panel } from "@/components/ui/panel";
import { DefinitionList } from "@/components/ui/definition-list";
import { UnitStatusBadge } from "@/components/ui/unit-status-badge";
import { UnitOwnershipTimeline } from "@/features/sales/components/unit-ownership-timeline";
import { getUnitOwnershipTimeline } from "@/features/sales/queries";
import { UnitStatusActions } from "@/features/units/components/unit-status-actions";
import { StatusHistory } from "@/features/units/components/status-history";
import { MergedUnitDetailsCard } from "@/features/units/components/merged-unit-details-card";
import { getMergeDetailsForUnit } from "@/features/units/merge-queries";
import {
  getUnitActiveBooking,
  getUnitById,
  listFloorUnits,
  listUnitStatusHistory,
} from "@/features/units/queries";
import { requireSession } from "@/lib/auth";
import { assertCan, can } from "@/lib/permissions";
import { computeTotalPrice, formatPkrCompact, formatPkrLedger } from "@/lib/money";
import {
  effectivePricingArea,
  formatSqft,
  formatUnitDisplayCode,
  formatUnitNumberLabel,
} from "@/lib/area";
import type { InventoryRow } from "@/features/units/types";
import { cn } from "@/lib/cn";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const row = await getUnitById(id);
  return {
    title: row ? row.unit.unitCode : "Unit",
  };
}

export default async function UnitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  assertCan(session.user.role, "units.read");

  const { id } = await params;
  const row = await getUnitById(id);
  if (!row) {
    notFound();
  }

  const [history, timeline, mergeInfo, floorUnits, activeBooking] = await Promise.all([
    listUnitStatusHistory(id),
    getUnitOwnershipTimeline(id),
    getMergeDetailsForUnit(id),
    listFloorUnits(row.unit.floorId),
    getUnitActiveBooking(id),
  ]);

  const canManage = can(session.user.role, "units.manage");
  const editHref = `/units/${row.unit.id}/edit` as Route;

  const unit: InventoryRow = {
    id: row.unit.id,
    unitCode: row.unit.unitCode,
    unitNumber: row.unit.unitNumber,
    floorId: row.unit.floorId,
    floorName: row.floorName,
    floorLevel: row.floorLevel,
    categoryId: row.unit.categoryId,
    categoryName: row.categoryName,
    netAreaSqft: row.unit.netAreaSqft,
    grossAreaSqft: row.unit.grossAreaSqft,
    ratePerSqftPkr: row.unit.ratePerSqftPkr,
    priceAdjustmentPkr: row.unit.priceAdjustmentPkr,
    priceAdjustmentReason: row.unit.priceAdjustmentReason,
    computedPricePkr: row.computedPricePkr,
    soldPricePkr: row.unit.soldPricePkr,
    bookPricePkr: row.bookPricePkr,
    status: row.unit.status,
    isSellable: row.unit.isSellable,
    ownershipGroup: row.unit.ownershipGroup,
    subOwner: row.unit.subOwner,
    bookingRef: row.unit.bookingRef,
    notes: row.unit.notes,
    version: row.unit.version,
    soldAt: row.unit.soldAt ? row.unit.soldAt.toISOString() : null,
    soldBy: row.unit.soldBy,
  };

  const isSold = unit.status === "SOLD";
  const displayPrice =
    isSold && unit.soldPricePkr ? unit.soldPricePkr : unit.bookPricePkr;

  const pricingArea = effectivePricingArea(unit.grossAreaSqft, unit.netAreaSqft);
  const baseValuation = computeTotalPrice(unit.ratePerSqftPkr, pricingArea, "0");

  // Floor units counts by status
  const floorAvailableCount = floorUnits.filter((u) => u.status === "AVAILABLE").length;
  const floorBookedCount = floorUnits.filter((u) => u.status === "BOOKED").length;
  const floorSoldCount = floorUnits.filter((u) => u.status === "SOLD").length;
  const floorReservedCount = floorUnits.filter((u) => u.status === "RESERVED").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={formatUnitDisplayCode(row.unit.unitCode, row.categoryName)}
        idTitle
        back={{ href: "/inventory", label: "Units" }}
        badge={<UnitStatusBadge status={unit.status} />}
        meta={[
          row.categoryName,
          `${row.floorName} (Level ${row.floorLevel})`,
          formatUnitNumberLabel(row.unit.unitCode, row.unit.unitNumber, row.categoryName),
          unit.isSellable ? "Sellable" : "Not sellable",
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {canManage && (
              <Button asChild variant="secondary" size="md">
                <Link href={editHref}>
                  <PencilSimple weight="light" className="mr-1.5 size-4" />
                  Edit unit
                </Link>
              </Button>
            )}

            {unit.status === "BOOKED" || activeBooking ? (
              <Button asChild variant="primary" size="md">
                <Link
                  href={
                    activeBooking
                      ? (`/bookings/${activeBooking.bookingId}` as Route)
                      : (`/bookings?q=${unit.unitCode}` as Route)
                  }
                >
                  View booking
                </Link>
              </Button>
            ) : unit.status === "SOLD" ? (
              <Button asChild variant="primary" size="md">
                <Link href={`/sold?q=${unit.unitCode}` as Route}>View sold record</Link>
              </Button>
            ) : unit.status === "RESERVED" ? (
              <Button asChild variant="primary" size="md">
                <Link href={`/reservations?q=${unit.unitCode}` as Route}>
                  View reservation
                </Link>
              </Button>
            ) : null}
          </div>
        }
      />

      {/* StatStrip: 3 or 4 cells */}
      <StatStrip columns={activeBooking ? 4 : 3} className="mb-0">
        <StatCell
          label={isSold ? "Sold Price" : "Total Asking Price"}
          value={formatPkrCompact(displayPrice)}
          prefixRs
          valueClassName={isSold ? "text-sold" : undefined}
          subLine={formatPkrLedger(displayPrice)}
        />
        <StatCell
          label="Rate per sq ft"
          value={formatPkrCompact(unit.ratePerSqftPkr)}
          prefixRs
          subLine={`${formatPkrLedger(unit.ratePerSqftPkr)} / sq ft`}
        />
        <StatCell
          label="Gross area"
          value={formatSqft(unit.grossAreaSqft ?? unit.netAreaSqft)}
          subLine={
            unit.grossAreaSqft
              ? `Net: ${formatSqft(unit.netAreaSqft)}`
              : "Standard footprint"
          }
        />
        {activeBooking && (
          <StatCell
            label="Active Booking"
            value={activeBooking.bookingNo}
            subLine={`${activeBooking.clientName} · ${Math.min(
              100,
              Math.round(
                (Number(activeBooking.paidTotal) /
                  (Number(activeBooking.netPrice) || 1)) *
                  100,
              ),
            )}% paid`}
          />
        )}
      </StatStrip>

      {/* Floor panel: Grid of all units on the same floor */}
      <Panel
        title={`Units on ${row.floorName}`}
        hint={`${floorAvailableCount} available · ${floorBookedCount} booked · ${floorReservedCount} reserved · ${floorSoldCount} sold`}
      >
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
          {floorUnits.map((tile) => {
            const isCurrent = tile.id === unit.id;

            const bgByStatus = {
              AVAILABLE: "bg-[#ECFDF3] border-[#ABEFC6] text-[#067647]",
              BOOKED: "bg-[#EFF8FF] border-[#B2DDFF] text-[#175CD3]",
              RESERVED: "bg-[#FEF6EE] border-[#F9DBAF] text-[#B54708]",
              SOLD: "bg-[#FEF3F2] border-[#FECDCA] text-[#B42318]",
            }[tile.status];

            return (
              <Link
                key={tile.id}
                href={`/units/${tile.id}`}
                className={cn(
                  "flex h-[52px] flex-col justify-center rounded-[6px] border px-2.5 transition-all select-none hover:shadow-xs",
                  bgByStatus,
                  isCurrent
                    ? "font-semibold ring-2 ring-primary ring-offset-1"
                    : "opacity-90 hover:opacity-100",
                )}
              >
                <span className="truncate font-sans text-[12px] leading-tight font-medium text-ink">
                  {tile.unitCode}
                </span>
                <span className="mt-0.5 truncate text-[10.5px] tracking-tight capitalize opacity-85">
                  {tile.status.toLowerCase()}
                </span>
              </Link>
            );
          })}
        </div>
      </Panel>

      {/* Details: 2 columns */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Left column: DefinitionLists */}
        <div className="space-y-6 lg:col-span-7">
          {/* Identity & Details */}
          <Panel title="Unit identity & location">
            <DefinitionList
              items={[
                { label: "Unit code", value: unit.unitCode },
                {
                  label: "Unit number",
                  value: formatUnitNumberLabel(
                    unit.unitCode,
                    unit.unitNumber,
                    unit.categoryName,
                  ),
                },
                { label: "Floor", value: `${unit.floorName} (Level ${unit.floorLevel})` },
                { label: "Category", value: unit.categoryName },
                {
                  label: "Sellable inventory",
                  value: unit.isSellable
                    ? "Yes (active for sale)"
                    : "No (held/restricted)",
                },
                ...(unit.ownershipGroup
                  ? [{ label: "Ownership group", value: unit.ownershipGroup }]
                  : []),
                ...(unit.subOwner ? [{ label: "Sub owner", value: unit.subOwner }] : []),
                ...(unit.notes ? [{ label: "Notes", value: unit.notes }] : []),
              ]}
            />
          </Panel>

          {/* Area & Pricing */}
          <Panel title="Area & valuation">
            <DefinitionList
              items={[
                { label: "Net area", value: formatSqft(unit.netAreaSqft) },
                {
                  label: "Gross area",
                  value: unit.grossAreaSqft
                    ? formatSqft(unit.grossAreaSqft)
                    : "Not specified",
                },
                {
                  label: "Rate per sq ft",
                  value: formatPkrLedger(unit.ratePerSqftPkr),
                },
                {
                  label: `Base valuation (${unit.ratePerSqftPkr} × ${pricingArea} sq ft)`,
                  value: formatPkrLedger(baseValuation),
                },
                ...(unit.priceAdjustmentPkr && unit.priceAdjustmentPkr !== "0"
                  ? [
                      {
                        label: unit.priceAdjustmentReason
                          ? `Adjustment (${unit.priceAdjustmentReason})`
                          : "Adjustment",
                        value: formatPkrLedger(unit.priceAdjustmentPkr),
                      },
                    ]
                  : []),
                {
                  label: isSold ? "Sold price (frozen)" : "Total calculated price",
                  value: (
                    <span className="font-semibold text-ink">
                      {formatPkrLedger(displayPrice)}
                    </span>
                  ),
                },
              ]}
            />
          </Panel>

          {/* Merged Unit details if applicable */}
          {mergeInfo && <MergedUnitDetailsCard mergeInfo={mergeInfo} />}
        </div>

        {/* Right column: Ownership Timeline & Status History */}
        <div className="space-y-6 lg:col-span-5">
          {/* Status Actions (Sell / Reverse buttons if available) */}
          <UnitStatusActions
            unit={unit}
            history={history}
            canSell={can(session.user.role, "units.sell")}
            canReverse={can(session.user.role, "units.reverse_sale")}
          />

          {/* Ownership Timeline */}
          <Panel title="Ownership & transactions" hint="Audited lifecycle events">
            <UnitOwnershipTimeline events={timeline} />
          </Panel>

          {/* Status History */}
          <Panel title="Status history" hint="Audit of status transitions">
            <StatusHistory entries={history} />
          </Panel>
        </div>
      </div>
    </div>
  );
}
