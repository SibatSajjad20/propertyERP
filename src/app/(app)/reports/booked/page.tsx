import { BookedReportScreen } from "@/features/reports/components/booked-report-screen";
import { getBookedUnitsReport, getReportFilterOptions } from "@/features/reports/queries";
import { reportFiltersSchema } from "@/features/reports/schema";
import { requireSession } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";

export const instant = false;

export const metadata = {
  title: "Booked Units Report — Sardar's Mall ERP",
};

export default async function BookedReportPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await requireSession();
  assertCan(session.user.role, "reports.read");

  const raw = await searchParams;
  const stringified: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "string") stringified[k] = v;
  }

  const filters = reportFiltersSchema.parse(stringified);
  const [data, filterOptions] = await Promise.all([
    getBookedUnitsReport(filters),
    getReportFilterOptions(),
  ]);

  return <BookedReportScreen data={data} filterOptions={filterOptions} />;
}
