import { InstallmentsReportScreen } from "@/features/reports/components/installments-report-screen";
import {
  getInstallmentsReport,
  getReportFilterOptions,
} from "@/features/reports/queries";
import { reportFiltersSchema } from "@/features/reports/schema";
import { requireSession } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";

export const instant = false;

export const metadata = {
  title: "Installments Report — Sardar's Mall ERP",
};

export default async function InstallmentsReportPage({
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
    getInstallmentsReport(filters),
    getReportFilterOptions(),
  ]);

  return <InstallmentsReportScreen data={data} filterOptions={filterOptions} />;
}
