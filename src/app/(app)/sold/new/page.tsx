import { getSelectableUnits } from "@/features/sales/queries";
import { getInventoryFilterOptions } from "@/features/units/queries";
import { DirectSaleScreen } from "@/features/sales/components/direct-sale-screen";
import { requireSession } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";

export const instant = false;

export const metadata = {
  title: "New Direct Sale",
};

export default async function NewDirectSalePage() {
  const session = await requireSession();
  assertCan(session.user.role, "sales.create");

  const [units, options] = await Promise.all([
    getSelectableUnits({}),
    getInventoryFilterOptions(),
  ]);

  return (
    <DirectSaleScreen
      units={units}
      floors={options.floors}
      categories={options.categories}
      role={session.user.role}
    />
  );
}
