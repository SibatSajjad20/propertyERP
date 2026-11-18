import type { Metadata } from "next";
import { requireSession } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";
import {
  getDetailedCollectionsReport,
  getReportFilterOptions,
} from "@/features/reports/queries";
import { reportFiltersSchema } from "@/features/reports/schema";
import { CollectionsReportScreen } from "@/features/reports/components/collections-report-screen";

export const metadata: Metadata = {
  title: "Collections Report",
};

export default async function CollectionsReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireSession();
  assertCan(session.user.role, "reports.read");

  const raw = await searchParams;
  const flat: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "string") flat[k] = v;
  }

  const parsed = reportFiltersSchema.parse(flat);
  const [data, filterOptions] = await Promise.all([
    getDetailedCollectionsReport(parsed),
    getReportFilterOptions(),
  ]);

  return <CollectionsReportScreen data={data} filterOptions={filterOptions} />;
}
