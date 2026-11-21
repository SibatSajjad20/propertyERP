import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getClientLedgerReport } from "@/features/reports/queries";
import { ClientLedgerPdf } from "@/features/reports/pdf/client-ledger-document";
import { reportFiltersSchema, type ReportFilters } from "@/features/reports/schema";
import { requireSession } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";
import { errorMessage } from "@/lib/errors";

export const maxDuration = 60;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession({ redirect: false });
    assertCan(session.user.role, "reports.read");

    const { id } = await context.params;

    const raw: Record<string, string> = {};
    request.nextUrl.searchParams.forEach((val, key) => {
      raw[key] = val;
    });

    const parsedFilters: ReportFilters = reportFiltersSchema.parse(raw);
    let data = await getClientLedgerReport(id, parsedFilters);

    if (!data) {
      return new NextResponse("Client statement data not found", { status: 404 });
    }

    // If client has multiple units but no unit was specified, default to first unit for PDF rendering
    if (data.requiresUnitSelection && data.units.length > 0) {
      const resolved = await getClientLedgerReport(id, {
        ...parsedFilters,
        unitId: data.units[0]!.unitId,
      });
      if (resolved) {
        data = resolved;
      }
    }

    const mode =
      request.nextUrl.searchParams.get("mode") === "print" ? "print" : "download";
    const download = request.nextUrl.searchParams.get("download") === "1";
    const disposition = download ? "attachment" : "inline";

    const pdfBuffer = await renderToBuffer(ClientLedgerPdf({ data, mode }));
    const stamp = new Date().toISOString().slice(0, 10);
    const sanitizedName = data.client.fullName.replace(/[^a-zA-Z0-9_-]/g, "_");
    const unitTag = data.selectedUnitDetails?.unitCode
      ? `-${data.selectedUnitDetails.unitCode}`
      : "";
    const filename = `sardars-mall-statement-${sanitizedName}${unitTag}-${stamp}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${disposition}; filename="${filename}"`,
        "X-Frame-Options": "SAMEORIGIN",
        "Content-Security-Policy": "frame-ancestors 'self'",
      },
    });
  } catch (error) {
    console.error("Client ledger PDF export error:", error);
    return new NextResponse(errorMessage(error), { status: 500 });
  }
}
