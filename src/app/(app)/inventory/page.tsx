import { withTransientDbRetry } from "@/db";
import { InventoryScreen } from "@/features/units/components/inventory-screen";
import { getPendingMergeRequestCount } from "@/features/units/merge-queries";
import {
  getInventoryFilterOptions,
  listInventory,
  listUnitStatusHistory,
} from "@/features/units/queries";
import { parseInventorySearchParams } from "@/features/units/schema";
import { requireSession } from "@/lib/auth";
import { assertCan, can } from "@/lib/permissions";

export const maxDuration = 30;

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
  const canMerge = can(session.user.role, "units.merge_request");
  const [{ rows, totals, nextCursor, pageSize }, options, history, pendingMergeCount] =
    await withTransientDbRetry(() =>
      Promise.all([
        listInventory(query),
        getInventoryFilterOptions(),
        query.unitId ? listUnitStatusHistory(query.unitId) : Promise.resolve([]),
        canMerge ? getPendingMergeRequestCount() : Promise.resolve(0),
      ]),
    );

  return (
    <InventoryScreen
      rows={rows}
      totals={totals}
      nextCursor={nextCursor}
      pageSize={pageSize}
      options={options}
      query={query}
      history={history}
      canManage={can(session.user.role, "units.manage")}
      canSell={can(session.user.role, "units.sell")}
      canReverse={can(session.user.role, "units.reverse_sale")}
      pendingMergeCount={pendingMergeCount}
      role={session.user.role}
    />
  );
}
