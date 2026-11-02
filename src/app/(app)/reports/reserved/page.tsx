import { ReservedReportScreen } from "@/features/reports/components/reserved-report-screen";
import {
  getReportFilterOptions,
  getReservedUnitsReport,
} from "@/features/reports/queries";
import { reportFiltersSchema } from "@/features/reports/schema";
import { requireSession } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";

export const instant = false;

export const metadata = {
  title: "Reserved Units Report — Sardar's Mall ERP",
};

export default async function ReservedReportPage({
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
    getReservedUnitsReport(filters),
    getReportFilterOptions(),
  ]);

  return <ReservedReportScreen data={data} filterOptions={filterOptions} />;
}
