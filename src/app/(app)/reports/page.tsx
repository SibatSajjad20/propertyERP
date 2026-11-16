import { SummaryReportScreen } from "@/features/reports/components/summary-report-screen";
import { loadSummaryReport } from "@/features/reports/load-summary";

export const metadata = {
  title: "Summary Report — Sardar's Mall ERP",
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { data, filterOptions } = await loadSummaryReport(searchParams);
  return <SummaryReportScreen data={data} filterOptions={filterOptions} />;
}
