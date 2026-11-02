import { NextRequest, NextResponse } from "next/server";
import {
  generateBookedUnitsExcel,
  generateClientLedgerExcel,
  generateInstallmentsExcel,
  generateReservedUnitsExcel,
  generateSoldUnitsExcel,
  generateSummaryExcel,
} from "@/features/reports/export";
import {
  getBookedUnitsReport,
  getClientLedgerReport,
  getInstallmentsReport,
  getReservedUnitsReport,
  getSoldUnitsReport,
  getSummaryReport,
} from "@/features/reports/queries";
import { reportFiltersSchema, type ReportFilters } from "@/features/reports/schema";
import { requireSession } from "@/lib/auth";
import { errorMessage } from "@/lib/errors";
import { assertCan } from "@/lib/permissions";

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
    const filterDesc = `Generated: ${stamp} | Filter: ${parsedFilters.preset}`;

    let buffer: Buffer;
    let filename: string;

    switch (type) {
      case "summary": {
        const data = await getSummaryReport(parsedFilters);
        buffer = await generateSummaryExcel(data, filterDesc);
        filename = `sardars-mall-summary-${stamp}.xlsx`;
        break;
      }
      case "sold": {
        const data = await getSoldUnitsReport(parsedFilters);
        buffer = await generateSoldUnitsExcel(data, filterDesc);
        filename = `sardars-mall-sold-units-${stamp}.xlsx`;
        break;
      }
      case "booked": {
        const data = await getBookedUnitsReport(parsedFilters);
        buffer = await generateBookedUnitsExcel(data, filterDesc);
        filename = `sardars-mall-booked-units-${stamp}.xlsx`;
        break;
      }
      case "reserved": {
        const data = await getReservedUnitsReport(parsedFilters);
        buffer = await generateReservedUnitsExcel(data, filterDesc);
        filename = `sardars-mall-reserved-units-${stamp}.xlsx`;
        break;
      }
      case "installments": {
        const data = await getInstallmentsReport(parsedFilters);
        buffer = await generateInstallmentsExcel(data, filterDesc);
        filename = `sardars-mall-installments-${stamp}.xlsx`;
        break;
      }
      case "client-ledger": {
        const clientId = parsedFilters.clientId;
        if (!clientId) {
          return NextResponse.json({ error: "Client ID is required" }, { status: 400 });
        }
        const data = await getClientLedgerReport(clientId, parsedFilters);
        if (!data) {
          return NextResponse.json({ error: "Client not found" }, { status: 404 });
        }
        buffer = await generateClientLedgerExcel(data, filterDesc);
        filename = `sardars-mall-ledger-${data.client.cnic}-${stamp}.xlsx`;
        break;
      }
      default:
        return NextResponse.json(
          { error: `Unknown report type: ${type}` },
          { status: 404 },
        );
    }

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 400 });
  }
}
