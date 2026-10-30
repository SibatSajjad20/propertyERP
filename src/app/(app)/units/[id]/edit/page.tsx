import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getInventoryFilterOptions, getUnitById } from "@/features/units/queries";
import { UnitEditScreen } from "@/features/units/components/unit-edit-screen";
import { requireSession } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";
import type { InventoryRow } from "@/features/units/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const row = await getUnitById(id);
  return {
    title: row ? `Edit ${row.unit.unitCode}` : "Edit Unit",
  };
}

export default async function EditUnitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  assertCan(session.user.role, "units.manage");

  const { id } = await params;
  const [row, options] = await Promise.all([
    getUnitById(id),
    getInventoryFilterOptions(),
  ]);

  if (!row) {
    notFound();
  }

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

  return <UnitEditScreen unit={unit} options={options} role={session.user.role} />;
}
