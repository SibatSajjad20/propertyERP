import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getAgreementDetail } from "@/features/agreements/queries";
import { SalePurchaseAgreementPdf } from "@/features/agreements/pdf/agreement-document";
import { requireSession } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";
import { errorMessage, errorStatus } from "@/lib/errors";

export const maxDuration = 60;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession({ redirect: false });
    assertCan(session.user.role, "agreements.read");

    const { id } = await params;
    const detail = await getAgreementDetail(id);
    if (!detail) return new NextResponse("Agreement not found", { status: 404 });

    const pdfBuffer = await renderToBuffer(
      SalePurchaseAgreementPdf({
        agreementNo: detail.agreement.agreementNo,
        agreementDate: detail.agreement.agreementDate,
        sellerName: detail.agreement.sellerName,
        anticipatedCompletionDate: detail.agreement.anticipatedCompletionDate,
        buyer: detail.buyer,
        nominee: detail.nominee,
        unit: {
          unitCode: detail.unit.unitCode,
          categoryName: detail.unit.categoryName,
          floorName: detail.unit.floorName,
          grossAreaSqft: detail.unit.grossAreaSqft,
        },
        financials: detail.financials,
        witness1Name: detail.agreement.witness1Name,
        witness2Name: detail.agreement.witness2Name,
        scheduleRows: detail.scheduleRows,
      }),
    );

    const download = new URL(request.url).searchParams.get("download") === "1";
    const disposition = download ? "attachment" : "inline";

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${disposition}; filename="${detail.agreement.agreementNo}-sale-purchase-agreement.pdf"`,
        "X-Frame-Options": "SAMEORIGIN",
        "Content-Security-Policy": "frame-ancestors 'self'",
      },
    });
  } catch (error) {
    return new NextResponse(errorMessage(error), { status: errorStatus(error) });
  }
}
