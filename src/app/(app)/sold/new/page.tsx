import { getCachedInventoryFilterOptions } from "@/features/units/queries";
import { DirectSaleScreen } from "@/features/sales/components/direct-sale-screen";
import { requireSession } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";

export const metadata = {
  title: "New Direct Sale",
};

export default async function NewDirectSalePage() {
  const session = await requireSession();
  assertCan(session.user.role, "sales.create");

  const options = await getCachedInventoryFilterOptions();

  return (
    <DirectSaleScreen
      units={[]}
      floors={options.floors}
      categories={options.categories}
      role={session.user.role}
    />
  );
}
