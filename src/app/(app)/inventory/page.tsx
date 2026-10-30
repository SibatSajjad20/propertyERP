import { InventoryScreen } from "@/features/units/components/inventory-screen";
import { getInventoryFilterOptions, listInventory } from "@/features/units/queries";
import { parseInventorySearchParams } from "@/features/units/schema";
import { requireSession } from "@/lib/auth";
import { assertCan, can } from "@/lib/permissions";

export const instant = false;

export const metadata = {
  title: "Inventory",
};

export default async function InventoryRoute({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await requireSession();
  assertCan(session.user.role, "units.read");

  const query = parseInventorySearchParams(await searchParams);
  const [{ rows, totals }, options] = await Promise.all([
    listInventory(query),
    getInventoryFilterOptions(),
  ]);

  return (
    <InventoryScreen
      rows={rows}
      totals={totals}
      options={options}
      query={query}
      canManage={can(session.user.role, "units.manage")}
      role={session.user.role}
    />
  );
}
