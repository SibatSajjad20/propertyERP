import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UnitRead } from "@/features/units/components/unit-read";
import { UnitStatusActions } from "@/features/units/components/unit-status-actions";
import { getUnitById, listUnitStatusHistory } from "@/features/units/queries";
import { requireSession } from "@/lib/auth";
import { assertCan, can } from "@/lib/permissions";

export const instant = false;

export const metadata = {
  title: "Unit",
};

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
  const inventoryHref = `/inventory?unit=${row.unit.id}&mode=edit` as Route;
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
    <div className="mx-auto flex min-h-0 w-full max-w-xl flex-1 flex-col">
      <div className="mb-3 flex items-baseline justify-between border-b border-line pb-3">
        <div>
          <p className="unit-code text-[13px] text-ink-muted">{row.unit.unitCode}</p>
          <h2 className="font-display text-[28px] text-ink">{row.unit.unitNumber}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={row.unit.status === "SOLD" ? "sold" : "available"}>
            {row.unit.status === "SOLD" ? "Sold" : "Available"}
          </Badge>
          {canManage ? (
            <Button asChild variant="outline">
              <Link href={inventoryHref}>Edit</Link>
            </Button>
          ) : null}
        </div>
      </div>
      <UnitStatusActions
        unit={unit}
        canSell={can(session.user.role, "units.sell")}
        canReverse={can(session.user.role, "units.reverse_sale")}
      >
        <UnitRead unit={unit} history={history} />
      </UnitStatusActions>
    </div>
  );
}
