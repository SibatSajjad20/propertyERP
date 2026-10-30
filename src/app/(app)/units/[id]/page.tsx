import type { Route } from "next";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, PencilSimple } from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BreadcrumbSet } from "@/components/app-shell/breadcrumb-set";
import { UnitRead } from "@/features/units/components/unit-read";
import { UnitStatusActions } from "@/features/units/components/unit-status-actions";
import { getUnitById, listUnitStatusHistory } from "@/features/units/queries";
import { requireSession } from "@/lib/auth";
import { assertCan, can } from "@/lib/permissions";

export const instant = false;

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
  const inventoryHref = `/inventory?unitId=${row.unit.id}&mode=edit` as Route;
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

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col space-y-6">
      <BreadcrumbSet parent="Inventory" current={row.unit.unitCode} />
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/inventory" className="text-ink-muted hover:text-ink">
            <ArrowLeft weight="light" className="mr-1 size-3.5" />
            Back to Inventory
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <span className="unit-code font-mono text-[13px] font-semibold text-primary">
            {row.unit.unitCode}
          </span>
          <h1 className="mt-0.5 text-[20px] font-semibold tracking-tight text-ink sm:text-[24px]">
            Unit {row.unit.unitNumber}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={row.unit.status === "SOLD" ? "sold" : "available"}>
            {row.unit.status === "SOLD" ? "Sold" : "Available"}
          </Badge>
          {canManage ? (
            <Button asChild variant="secondary" size="md">
              <Link href={inventoryHref}>
                <PencilSimple weight="light" className="mr-1.5 size-3.5" />
                Edit unit
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="overflow-hidden rounded-[8px] border border-line bg-surface">
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
