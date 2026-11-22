import { NextResponse } from "next/server";
import { buildBookingReceiptPdf } from "@/features/documents/receipts";
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
    assertCan(session.user.role, "bookings.read");

    const { id } = await params;
    const signatory = new URL(request.url).searchParams.get("signatory");
    const { pdf, receiptNo } = await buildBookingReceiptPdf(id, signatory);
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${receiptNo}-down-payment-receipt.pdf"`,
      },
    });
  } catch (err) {
    return new NextResponse(errorMessage(err), { status: errorStatus(err) });
  }
}
