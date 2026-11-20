import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import {
  getBookedUnitsReport,
  getDetailedCollectionsReport,
  getInstallmentsReport,
  getReservedUnitsReport,
  getSoldUnitsReport,
  getSummaryReport,
} from "@/features/reports/queries";
import {
  ReportPdfDocument,
  type ReportColumn,
  type ReportStat,
} from "@/features/reports/pdf/report-document";
import { reportFiltersSchema, type ReportFilters } from "@/features/reports/schema";
import { requireSession } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";
import { errorMessage } from "@/lib/errors";
import { formatPkr } from "@/lib/money";

export const maxDuration = 60;

function formatDate(date: Date | string | null | undefined) {
  if (!date) return "—";
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return String(date);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ type: string }> },
) {
  try {
    const session = await requireSession({ redirect: false });
    assertCan(session.user.role, "reports.read");

    const { type } = await context.params;

    const raw: Record<string, string> = {};
    request.nextUrl.searchParams.forEach((val, key) => {
      raw[key] = val;
    });

    const parsedFilters: ReportFilters = reportFiltersSchema.parse(raw);
    const stamp = new Date().toISOString().slice(0, 10);
    const filterDesc = `Generated: ${stamp} | Period: ${parsedFilters.preset.replace(/_/g, " ")}`;

    let title = "REPORT";
    let subtitle = "System Generated Report";
    let stats: ReportStat[] = [];
    let columns: ReportColumn[] = [];
    let rows: Array<Record<string, unknown>> = [];
    let totals: Record<string, string> | undefined;

    switch (type) {
      case "sold": {
        title = "SOLD UNITS REPORT";
        subtitle = "Detailed audit of all confirmed sales and completed bookings";
        const data = await getSoldUnitsReport(parsedFilters);
        stats = [
          { label: "Total Sold Units", value: String(data.kpi.totalSoldUnits) },
          { label: "Total Sales Value", value: formatPkr(data.kpi.totalSalesValuePkr) },
          { label: "Avg Price / Sqft", value: formatPkr(data.kpi.averageRatePerSqftPkr) },
          { label: "Bought Back", value: String(data.kpi.boughtBackCount) },
        ];
        columns = [
          { key: "unitCode", label: "Unit", width: "10%", align: "center" },
          { key: "floorName", label: "Floor", width: "10%", align: "center" },
          { key: "categoryName", label: "Category", width: "12%", align: "center" },
          { key: "clientName", label: "Customer", width: "20%", align: "left" },
          { key: "clientCnic", label: "CNIC", width: "16%", align: "center" },
          { key: "source", label: "Sale Type", width: "12%", align: "center" },
          { key: "soldDate", label: "Sale Date", width: "10%", align: "center" },
          {
            key: "salePrice",
            label: "Price (PKR)",
            width: "10%",
            align: "right",
            isMoney: true,
          },
        ];
        rows = data.rows.map((u) => ({
          unitCode: u.unitCode,
          floorName: u.floorName,
          categoryName: u.categoryName,
          clientName: u.clientName,
          clientCnic: u.clientCnic,
          source: u.source,
          soldDate: formatDate(u.soldDate),
          salePrice: u.salePrice,
        }));
        totals = {
          salePrice: formatPkr(data.kpi.totalSalesValuePkr),
        };
        break;
      }

      case "booked": {
        title = "BOOKED UNITS REPORT";
        subtitle =
          "Installment payment contracts, recovery metrics, and pending balances";
        const data = await getBookedUnitsReport(parsedFilters);
        stats = [
          { label: "Total Booked", value: String(data.kpi.totalBookings) },
          { label: "Total Net Value", value: formatPkr(data.kpi.totalNetPricePkr) },
          { label: "Total Collected", value: formatPkr(data.kpi.totalPaidPkr) },
          { label: "Outstanding Balance", value: formatPkr(data.kpi.totalBalancePkr) },
        ];
        columns = [
          { key: "bookingNo", label: "Booking #", width: "12%", align: "center" },
          { key: "unitCode", label: "Unit", width: "10%", align: "center" },
          { key: "clientName", label: "Customer", width: "20%", align: "left" },
          { key: "clientPhone", label: "Phone", width: "14%", align: "center" },
          { key: "plan", label: "Plan", width: "12%", align: "center" },
          {
            key: "netPrice",
            label: "Net Price",
            width: "11%",
            align: "right",
            isMoney: true,
          },
          {
            key: "paid",
            label: "Paid Total",
            width: "11%",
            align: "right",
            isMoney: true,
          },
          {
            key: "balance",
            label: "Balance",
            width: "10%",
            align: "right",
            isMoney: true,
          },
        ];
        rows = data.rows.map((b) => ({
          bookingNo: b.bookingNo,
          unitCode: b.unitCode,
          clientName: b.clientName,
          clientPhone: b.clientPhone,
          plan: b.plan.replace(/_/g, " "),
          netPrice: b.netPrice,
          paid: b.paid,
          balance: b.balance,
        }));
        totals = {
          netPrice: formatPkr(data.kpi.totalNetPricePkr),
          paid: formatPkr(data.kpi.totalPaidPkr),
          balance: formatPkr(data.kpi.totalBalancePkr),
        };
        break;
      }

      case "reserved": {
        title = "RESERVED UNITS REPORT";
        subtitle = "Active temporary reservations, expiry monitoring, and token amounts";
        const data = await getReservedUnitsReport(parsedFilters);
        stats = [
          { label: "Active Reserved", value: String(data.kpi.activeCount) },
          { label: "Expired", value: String(data.kpi.expiredCount) },
          { label: "Tokens Collected", value: formatPkr(data.kpi.totalTokenAmountPkr) },
          { label: "Token Count", value: String(data.kpi.tokenCount) },
        ];
        columns = [
          { key: "unitCode", label: "Unit", width: "12%", align: "center" },
          { key: "floorName", label: "Floor", width: "12%", align: "center" },
          { key: "clientName", label: "Customer", width: "20%", align: "left" },
          { key: "clientPhone", label: "Phone", width: "16%", align: "center" },
          { key: "reservedOn", label: "Reserved On", width: "13%", align: "center" },
          { key: "expiresAt", label: "Expires At", width: "13%", align: "center" },
          {
            key: "tokenAmountPkr",
            label: "Token (PKR)",
            width: "14%",
            align: "right",
            isMoney: true,
          },
        ];
        rows = data.rows.map((u) => ({
          unitCode: u.unitCode,
          floorName: u.floorName,
          clientName: u.clientName,
          clientPhone: u.clientPhone,
          reservedOn: formatDate(u.reservedOn),
          expiresAt: formatDate(u.expiresAt),
          tokenAmountPkr: u.tokenAmountPkr || "—",
        }));
        totals = {
          tokenAmountPkr: formatPkr(data.kpi.totalTokenAmountPkr),
        };
        break;
      }

      case "collections": {
        title = "COLLECTIONS REPORT";
        subtitle =
          "Comprehensive breakdown of cash and bank collections across all categories";
        const data = await getDetailedCollectionsReport(parsedFilters);
        stats = [
          {
            label: "Total Collected",
            value: formatPkr(data.summary.grandTotalCollectedPkr),
          },
          { label: "Down Payments", value: formatPkr(data.summary.downPaymentTotalPkr) },
          { label: "Installments", value: formatPkr(data.summary.installmentsTotalPkr) },
          { label: "Tokens", value: formatPkr(data.summary.tokenTotalPkr) },
        ];
        columns = [
          { key: "receiptNo", label: "Receipt #", width: "14%", align: "center" },
          { key: "date", label: "Date", width: "11%", align: "center" },
          { key: "clientName", label: "Customer", width: "20%", align: "left" },
          { key: "unitCode", label: "Unit", width: "10%", align: "center" },
          { key: "category", label: "Category", width: "15%", align: "center" },
          { key: "method", label: "Method", width: "14%", align: "center" },
          {
            key: "amount",
            label: "Amount (PKR)",
            width: "16%",
            align: "right",
            isMoney: true,
          },
        ];
        const allTx = [
          ...data.downPayments.map((x) => ({ ...x, category: "Down Payment" })),
          ...data.installments.map((x) => ({ ...x, category: "Installment" })),
          ...data.possessions.map((x) => ({ ...x, category: "Possession" })),
          ...data.balloons.map((x) => ({ ...x, category: "Balloon" })),
          ...data.tokens.map((x) => ({ ...x, category: "Token" })),
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        rows = allTx.map((tx) => ({
          receiptNo: tx.receiptNo || "—",
          date: formatDate(tx.date),
          clientName: tx.clientName,
          unitCode: tx.unitCode,
          category: tx.category,
          method: tx.method ? tx.method.replace(/_/g, " ") : "—",
          amount: tx.amountPkr,
        }));
        totals = {
          amount: formatPkr(data.summary.grandTotalCollectedPkr),
        };
        break;
      }

      case "installments": {
        title = "INSTALLMENT DUES REPORT";
        subtitle = "Aging analysis of installment dues, arrears, and upcoming maturities";
        const data = await getInstallmentsReport(parsedFilters);
        stats = [
          { label: "Total Due", value: formatPkr(data.kpi.totalDuePkr) },
          { label: "Total Paid", value: formatPkr(data.kpi.totalPaidPkr) },
          { label: "Total Balance", value: formatPkr(data.kpi.totalBalancePkr) },
          { label: "Total Overdue", value: formatPkr(data.kpi.overduePkr) },
        ];
        columns = [
          { key: "bookingNo", label: "Booking #", width: "12%", align: "center" },
          { key: "unitCode", label: "Unit", width: "10%", align: "center" },
          { key: "customer", label: "Customer", width: "18%", align: "left" },
          { key: "seq", label: "Seq", width: "8%", align: "center" },
          { key: "dueDate", label: "Due Date", width: "12%", align: "center" },
          {
            key: "amount",
            label: "Due Amount",
            width: "14%",
            align: "right",
            isMoney: true,
          },
          {
            key: "paidAmount",
            label: "Paid Amount",
            width: "13%",
            align: "right",
            isMoney: true,
          },
          { key: "status", label: "Status", width: "13%", align: "center" },
        ];
        rows = data.rows.map((r) => ({
          bookingNo: r.bookingNo,
          unitCode: r.unitCode,
          customer: r.clientName,
          seq: `#${r.seq}`,
          dueDate: formatDate(r.dueDate),
          amount: r.amount,
          paidAmount: r.paid,
          status: r.status,
        }));
        totals = {
          amount: formatPkr(data.kpi.totalDuePkr),
          paidAmount: formatPkr(data.kpi.totalPaidPkr),
        };
        break;
      }

      case "summary":
      default: {
        title = "EXECUTIVE SUMMARY REPORT";
        subtitle = "Portfolio health, sales velocity, net collections, and receivables";
        const data = await getSummaryReport(parsedFilters);
        stats = [
          { label: "Total Units", value: String(data.unitsByStatus.total.count) },
          { label: "Sold Units", value: String(data.unitsByStatus.sold.count) },
          { label: "Net Collections", value: formatPkr(data.periodMetrics.collectedPkr) },
          {
            label: "Receivables",
            value: formatPkr(data.periodMetrics.outstandingReceivablesPkr),
          },
        ];
        columns = [
          { key: "floorName", label: "Floor", width: "20%", align: "center" },
          { key: "totalUnits", label: "Total Units", width: "15%", align: "center" },
          { key: "soldUnits", label: "Sold", width: "15%", align: "center" },
          { key: "bookedUnits", label: "Booked", width: "15%", align: "center" },
          { key: "availableUnits", label: "Available", width: "15%", align: "center" },
          {
            key: "totalValuePkr",
            label: "Total Value (PKR)",
            width: "20%",
            align: "right",
            isMoney: true,
          },
        ];
        rows = data.floorBreakdown.map((f) => ({
          floorName: f.floorName,
          totalUnits: String(f.totalUnits),
          soldUnits: String(f.soldCount),
          bookedUnits: String(f.bookedCount),
          availableUnits: String(f.availableCount),
          totalValuePkr: f.totalValuePkr,
        }));
        break;
      }
    }

    const pdfBuffer = await renderToBuffer(
      ReportPdfDocument({
        title,
        subtitle,
        filterDesc,
        stats,
        columns,
        rows,
        totals,
        orientation: "landscape",
      }),
    );

    const filename = `sardars-mall-${type}-report-${stamp}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Report PDF export error:", error);
    return new NextResponse(errorMessage(error), { status: 500 });
  }
}
