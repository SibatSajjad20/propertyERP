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
import { UnitActionDropdown } from "@/features/units/components/unit-action-dropdown";
import { StatusHistory } from "@/features/units/components/status-history";
import { MergedUnitDetailsCard } from "@/features/units/components/merged-unit-details-card";
import { getMergeDetailsForUnit } from "@/features/units/merge-queries";
import {
  getUnitActiveBooking,
  getUnitById,
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

  const [history, timeline, mergeInfo, activeBooking] = await Promise.all([
    listUnitStatusHistory(id),
    getUnitOwnershipTimeline(id),
    getMergeDetailsForUnit(id),
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

  return (
    <div className="flex min-h-0 flex-1 flex-col space-y-6">
      {/* Header */}
      <PageHeader
        className="mb-1"
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
              <Button
                asChild
                variant="secondary"
                size="md"
                className="h-[36px] w-[195px] justify-center"
              >
                <Link href={editHref}>
                  <PencilSimple weight="light" className="mr-1.5 size-4" />
                  Edit unit
                </Link>
              </Button>
            )}

            {unit.status === "AVAILABLE" && (
              <UnitActionDropdown unitId={unit.id} className="h-[36px] w-[195px]" />
            )}

            {unit.status === "BOOKED" || activeBooking ? (
              <Button
                asChild
                variant="primary"
                size="md"
                className="h-[36px] w-[195px] justify-center"
              >
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
              <Button
                asChild
                variant="primary"
                size="md"
                className="h-[36px] w-[195px] justify-center"
              >
                <Link href={`/sold?q=${unit.unitCode}` as Route}>View sold record</Link>
              </Button>
            ) : unit.status === "RESERVED" ? (
              <Button
                asChild
                variant="primary"
                size="md"
                className="h-[36px] w-[195px] justify-center"
              >
                <Link href={`/reservations?q=${unit.unitCode}` as Route}>
                  View reservation
                </Link>
              </Button>
            ) : null}
          </div>
        }
      />

      {/* StatStrip: 3 or 4 cells */}
      <StatStrip columns={activeBooking ? 4 : 3} className="mb-2">
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

      {/* Primary Specifications: Identity & Location on Left, Area & Valuation on Right */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Identity & Details */}
        <Panel
          title="Unit identity & location"
          className="flex h-full flex-col"
          bodyClassName="flex-1"
        >
          <DefinitionList
            items={[
              {
                label: "Unit code",
                value: (
                  <span className="unit-code font-mono font-medium text-ink">
                    {unit.unitCode}
                  </span>
                ),
              },
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
                value: unit.isSellable ? "Yes (active for sale)" : "No (held/restricted)",
              },
              ...(unit.subOwner ? [{ label: "Sub owner", value: unit.subOwner }] : []),
              ...(unit.notes ? [{ label: "Notes", value: unit.notes }] : []),
            ]}
          />
        </Panel>

        {/* Area & Pricing */}
        <Panel
          title="Area & valuation"
          className="flex h-full flex-col"
          bodyClassName="flex-1"
        >
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
      </div>

      {/* Merged Unit details if applicable: Full Width across page */}
      {mergeInfo && <MergedUnitDetailsCard mergeInfo={mergeInfo} />}

      {/* Audited History & Lifecycle: Ownership Timeline on Left, Status History on Right */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        {/* Ownership Timeline */}
        <Panel
          title="Ownership & transactions"
          hint="Audited lifecycle events"
          className="flex h-full flex-col"
          bodyClassName="flex-1"
        >
          <UnitOwnershipTimeline events={timeline} />
        </Panel>

        {/* Status History */}
        <Panel
          title="Status history"
          hint="Audit of status transitions"
          className="flex h-full flex-col"
          bodyClassName="flex-1"
        >
          <StatusHistory entries={history} />
        </Panel>
      </div>
    </div>
  );
}
