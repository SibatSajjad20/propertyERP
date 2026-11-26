import type { Metadata } from "next";
import { requireSession } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";
import { getInventoryFilterOptions, listInventory } from "@/features/units/queries";
import { MergeWizardScreen } from "@/features/units/components/merge-wizard-screen";

export const metadata: Metadata = {
  title: "Merge Units",
};

export default async function InventoryMergePage() {
  const session = await requireSession();
  assertCan(session.user.role, "units.merge_request");

  const [{ rows }, options] = await Promise.all([
    listInventory({
      status: "AVAILABLE",
      unpaged: true,
      sort: "unitCode",
      dir: "asc",
    }),
    getInventoryFilterOptions(),
  ]);

  return (
    <MergeWizardScreen availableUnits={rows} options={options} role={session.user.role} />
  );
}
