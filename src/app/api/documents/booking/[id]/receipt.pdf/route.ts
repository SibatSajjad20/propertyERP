import { NextResponse } from "next/server";
import { buildBookingReceiptPdf } from "@/features/documents/receipts";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { ValidationError } from "@/lib/errors";

export const maxDuration = 60;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });
  if (!can(session.user.role, "bookings.read")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { id } = await params;
  const signatory = new URL(request.url).searchParams.get("signatory");
  try {
    const { pdf, receiptNo } = await buildBookingReceiptPdf(id, signatory);
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${receiptNo}-down-payment-receipt.pdf"`,
      },
    });
  } catch (err) {
    if (err instanceof ValidationError) {
      return new NextResponse(err.message, { status: 400 });
    }
    throw err;
  }
}
