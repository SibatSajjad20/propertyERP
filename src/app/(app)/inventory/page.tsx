import { InventoryScreen } from "@/features/units/components/inventory-screen";
import {
  getInventoryFilterOptions,
  listInventory,
  listUnitStatusHistory,
} from "@/features/units/queries";
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
  const [{ rows, totals }, options, history] = await Promise.all([
    listInventory(query),
    getInventoryFilterOptions(),
    query.unitId ? listUnitStatusHistory(query.unitId) : Promise.resolve([]),
  ]);

  return (
    <InventoryScreen
      rows={rows}
      totals={totals}
      options={options}
      query={query}
      history={history}
      canManage={can(session.user.role, "units.manage")}
      canSell={can(session.user.role, "units.sell")}
      canReverse={can(session.user.role, "units.reverse_sale")}
      role={session.user.role}
    />
  );
}
