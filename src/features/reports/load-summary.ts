import { getReportFilterOptions, getSummaryReport } from "@/features/reports/queries";
import { reportFiltersSchema } from "@/features/reports/schema";
import { requireSession } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";

export async function loadSummaryReport(
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>,
) {
  const session = await requireSession();
  assertCan(session.user.role, "reports.read");

  const raw = await searchParams;
  const stringified: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "string") stringified[k] = v;
  }

  const filters = reportFiltersSchema.parse(stringified);
  const data = await getSummaryReport(filters);
  const filterOptions = await getReportFilterOptions();
  return { data, filterOptions };
}
