import { getCachedInventoryFilterOptions } from "@/features/units/queries";
import { getSelectableUnits } from "@/features/sales/queries";
import { DirectSaleScreen } from "@/features/sales/components/direct-sale-screen";
import { requireSession } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";

export const metadata = {
  title: "New Direct Sale",
};

export default async function NewDirectSalePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await requireSession();
  assertCan(session.user.role, "sales.create");

  const params = await searchParams;
  const unitId = typeof params.unitId === "string" ? params.unitId : undefined;

  const [options, units] = await Promise.all([
    getCachedInventoryFilterOptions(),
    unitId ? getSelectableUnits({ unitId }) : Promise.resolve([]),
  ]);

  return (
    <DirectSaleScreen
      units={units}
      floors={options.floors}
      categories={options.categories}
      role={session.user.role}
      preselectedUnitId={unitId}
    />
  );
}
