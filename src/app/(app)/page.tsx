import { DashboardScreen } from "@/features/dashboard/components/dashboard-screen";
import {
  getBlocksBreakdown,
  getDashboardFilterOptions,
  getDashboardStats,
  getFloorsLedger,
  getRecentActivity,
  getSalesOverTime,
} from "@/features/dashboard/queries";
import { dashboardFilterSchema } from "@/features/dashboard/schema";
import { requireSession } from "@/lib/auth";
import { assertCan, can } from "@/lib/permissions";

export const instant = false;

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await requireSession();
  assertCan(session.user.role, "dashboard.read");

  const rawParams = await searchParams;
  const propertyParam = Array.isArray(rawParams.propertyId)
    ? rawParams.propertyId[0]
    : rawParams.propertyId;
  const blockParam = Array.isArray(rawParams.blockId)
    ? rawParams.blockId[0]
    : rawParams.blockId;

  const parsed = dashboardFilterSchema.safeParse({
    propertyId: propertyParam || undefined,
    blockId: blockParam || undefined,
  });

  const filter = parsed.success
    ? {
        propertyId: parsed.data.propertyId || undefined,
        blockId: parsed.data.blockId || undefined,
      }
    : undefined;

  const isSales = session.user.role === "SALES";

  const [stats, floors, blocks, salesOverTime, activities, filterOptions] =
    await Promise.all([
      getDashboardStats(filter),
      getFloorsLedger(filter),
      getBlocksBreakdown(filter),
      getSalesOverTime(filter),
      isSales ? Promise.resolve([]) : getRecentActivity(10),
      getDashboardFilterOptions(),
    ]);

  return (
    <DashboardScreen
      stats={stats}
      floors={floors}
      blocks={blocks}
      salesOverTime={salesOverTime}
      activities={activities}
      filterOptions={filterOptions}
      selectedPropertyId={filter?.propertyId}
      selectedBlockId={filter?.blockId}
      role={session.user.role}
      canManage={can(session.user.role, "units.manage")}
    />
  );
}
