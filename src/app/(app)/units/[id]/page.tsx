import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, PencilSimple } from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BreadcrumbSet } from "@/components/app-shell/breadcrumb-set";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { UnitRead } from "@/features/units/components/unit-read";
import { UnitStatusActions } from "@/features/units/components/unit-status-actions";
import { getUnitById, listUnitStatusHistory } from "@/features/units/queries";
import { requireSession } from "@/lib/auth";
import { assertCan, can } from "@/lib/permissions";
import { formatPkrCompact, formatPkrLedger } from "@/lib/money";
import { formatSqft } from "@/lib/area";

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
  const [row, history] = await Promise.all([getUnitById(id), listUnitStatusHistory(id)]);
  if (!row) {
    notFound();
  }

  const canManage = can(session.user.role, "units.manage");
  const editHref = `/units/${row.unit.id}/edit` as Route;
  const unit = {
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

  return (
    <div className="t-page-enter mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col space-y-6">
      <BreadcrumbSet parent="Inventory" current={row.unit.unitCode} />
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/inventory" className="text-ink-muted hover:text-ink">
            <ArrowLeft weight="light" className="mr-1 size-3.5" />
            Back to Inventory
          </Link>
        </Button>
      </div>

      {/* Wide Header with unit code (mono) + status badge + actions */}
      <div className="flex flex-col gap-3 border-b border-line pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="unit-code font-mono text-[22px] font-semibold text-primary">
              {row.unit.unitCode}
            </span>
            <Badge tone={isSold ? "sold" : "available"}>
              {isSold ? "Sold" : "Available"}
            </Badge>
          </div>
          <h1 className="mt-1 text-[15px] font-medium text-ink-muted">
            Unit {row.unit.unitNumber} · {row.floorName} (Level {row.floorLevel}) ·{" "}
            {row.categoryName}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {canManage ? (
            <Button asChild variant="secondary" size="md">
              <Link href={editHref}>
                <PencilSimple weight="light" className="mr-1.5 size-3.5" />
                Edit unit
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      {/* KPI Cards (Area, Rate, Price) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Area KPI Card */}
        <div className="card card-interactive kpi flex flex-col justify-between p-4 sm:p-5">
          <p className="text-[11px] font-medium tracking-wider text-ink-muted uppercase">
            Net Area
          </p>
          <div className="mt-3">
            <div className="area text-[26px] leading-none font-semibold text-ink sm:text-[28px]">
              <AnimatedNumber value={formatSqft(unit.netAreaSqft)} />
            </div>
            {unit.grossAreaSqft ? (
              <p className="area mt-1.5 text-[12px] text-ink-muted">
                Gross: {formatSqft(unit.grossAreaSqft)}
              </p>
            ) : (
              <p className="mt-1.5 text-[12px] text-ink-muted">Standard footprint</p>
            )}
          </div>
        </div>

        {/* Rate KPI Card */}
        <div className="card card-interactive kpi flex flex-col justify-between p-4 sm:p-5">
          <p className="text-[11px] font-medium tracking-wider text-ink-muted uppercase">
            Rate per sq ft
          </p>
          <div className="mt-3">
            <div className="price text-[26px] leading-none font-semibold text-ink sm:text-[28px]">
              <AnimatedNumber value={formatPkrCompact(unit.ratePerSqftPkr)} />
            </div>
            <p className="price mt-1.5 text-[12px] text-ink-muted">
              {formatPkrLedger(unit.ratePerSqftPkr)} / sq ft
            </p>
          </div>
        </div>

        {/* Price KPI Card */}
        <div className="card card-interactive kpi flex flex-col justify-between p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium tracking-wider text-ink-muted uppercase">
              {isSold ? "Sold Price" : "Total Asking Price"}
            </p>
            <span
              className={`size-2 rounded-full ${isSold ? "bg-sold" : "bg-available"}`}
              aria-hidden="true"
            />
          </div>
          <div className="mt-3">
            <div
              className={`price text-[26px] leading-none font-semibold sm:text-[28px] ${
                isSold ? "text-sold" : "text-ink"
              }`}
            >
              <AnimatedNumber value={formatPkrCompact(displayPrice)} />
            </div>
            <p className="price mt-1.5 font-sans text-[12px] text-ink-muted tabular-nums">
              {formatPkrLedger(displayPrice)}
            </p>
          </div>
        </div>
      </div>

      {/* Main card with status actions, unit details dl, and history timeline */}
      <div className="card overflow-hidden">
        <UnitStatusActions
          unit={unit}
          canSell={can(session.user.role, "units.sell")}
          canReverse={can(session.user.role, "units.reverse_sale")}
        >
          <UnitRead unit={unit} history={history} />
        </UnitStatusActions>
      </div>
    </div>
  );
}
