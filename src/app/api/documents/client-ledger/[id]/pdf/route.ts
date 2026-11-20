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
    const data = await getClientLedgerReport(id, parsedFilters);

    if (!data) {
      return new NextResponse("Client statement data not found", { status: 404 });
    }

    const pdfBuffer = await renderToBuffer(ClientLedgerPdf({ data }));
    const stamp = new Date().toISOString().slice(0, 10);
    const sanitizedName = data.client.fullName.replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `sardars-mall-statement-${sanitizedName}-${stamp}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Client ledger PDF export error:", error);
    return new NextResponse(errorMessage(error), { status: 500 });
  }
}
