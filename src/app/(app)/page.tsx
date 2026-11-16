import { DashboardScreen } from "@/features/dashboard/components/dashboard-screen";
import {
  getDashboardBundle,
  getDashboardFilterOptions,
  getRecentActivity,
} from "@/features/dashboard/queries";
import { dashboardFilterSchema } from "@/features/dashboard/schema";
import { requireSession } from "@/lib/auth";
import { assertCan, can } from "@/lib/permissions";

export const maxDuration = 30;

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

  let bundle: Awaited<ReturnType<typeof getDashboardBundle>>;
  let activities: Awaited<ReturnType<typeof getRecentActivity>> = [];
  let filterOptions: Awaited<ReturnType<typeof getDashboardFilterOptions>> = {
    properties: [],
    blocks: [],
  };

  try {
    [bundle, activities, filterOptions] = await Promise.all([
      getDashboardBundle(filter),
      isSales ? Promise.resolve([]) : getRecentActivity(8),
      getDashboardFilterOptions(),
    ]);
  } catch (err) {
    console.error("Dashboard bundle fetch error during SSR:", err);
    bundle = {
      stats: {
        total: 0,
        available: 0,
        reserved: 0,
        booked: 0,
        sold: 0,
        soldPercent: 0,
        availableValuePkr: "0",
        reservedValuePkr: "0",
        bookedValuePkr: "0",
        soldValuePkr: "0",
        monthReversalsPkr: "0",
        netCollectedPkr: "0",
      },
      attention: {
        overdueCount: 0,
        overduePkr: "0",
        dueThisWeekCount: 0,
        dueThisWeekPkr: "0",
        expiringReservationsCount: 0,
      },
      floors: [],
      blocks: [],
      salesOverTime: [],
    };
  }

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
