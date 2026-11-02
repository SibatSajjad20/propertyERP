import type { Metadata } from "next";
import { getInventoryFilterOptions } from "@/features/units/queries";
import { UnitCreateScreen } from "@/features/units/components/unit-create-screen";
import { requireSession } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";

export const instant = false;

export const metadata: Metadata = {
  title: "New Unit",
};

export default async function NewUnitPage() {
  const session = await requireSession();
  assertCan(session.user.role, "units.manage");

  const options = await getInventoryFilterOptions();

  return <UnitCreateScreen options={options} role={session.user.role} />;
}
