import { DashboardScreen } from "@/features/dashboard/components/dashboard-screen";
import {
  getDashboardBundle,
  getDashboardFilterOptions,
  getRecentActivity,
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

  const [bundle, activities, filterOptions] = await Promise.all([
    getDashboardBundle(filter),
    isSales ? Promise.resolve([]) : getRecentActivity(8),
    getDashboardFilterOptions(),
  ]);

  return (
    <DashboardScreen
      stats={bundle.stats}
      attention={bundle.attention}
      floors={bundle.floors}
      blocks={bundle.blocks}
      salesOverTime={bundle.salesOverTime}
      activities={activities}
      filterOptions={filterOptions}
      selectedPropertyId={filter?.propertyId}
      selectedBlockId={filter?.blockId}
      role={session.user.role}
      canManage={can(session.user.role, "units.manage")}
    />
  );
}
