import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getBookingDetail } from "@/features/sales/queries";
import { InstallmentSchedulePdf } from "@/features/installments/pdf/installment-schedule-document";
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
    assertCan(session.user.role, "installments.read");

    const { id } = await context.params;
    const detail = await getBookingDetail(id);
    if (!detail) {
      return new NextResponse("Booking not found", { status: 404 });
    }

    const { booking, installments, payments } = detail;

    // Calculate balance
    const netNum = Number(booking.netPrice) || 0;
    const paidNum = Number(booking.paidTotal) || 0;
    const balanceNum = Math.max(0, netNum - paidNum);

    const pdfBuffer = await renderToBuffer(
      InstallmentSchedulePdf({
        bookingNo: booking.bookingNo,
        applicationFormNo: booking.applicationFormNo,
        bookingDate: booking.createdAt,
        plan: booking.plan,
        client: {
          title: booking.clientTitle,
          fullName: booking.clientName,
          cnic: booking.clientCnic,
          phone: booking.clientPhone,
          address: booking.homeAddress,
        },
        unit: {
          unitCode: booking.unitCode,
          floorName: booking.floorName,
          categoryName: booking.categoryName,
          grossAreaSqft: booking.grossAreaSqft,
        },
        financials: {
          listPrice: booking.listPrice,
          discountValue: booking.discountValue,
          netPrice: booking.netPrice,
          downPayment: booking.downPayment,
          paidTotal: booking.paidTotal,
          balance: balanceNum.toFixed(2),
        },
        installments: installments.map((inst) => ({
          seq: inst.seq,
          label: inst.label,
          type: inst.type,
          dueDate: inst.dueDate,
          amount: inst.amount,
          paidAmount: inst.paidAmount,
          status: inst.status,
          receiptNo: inst.receiptNos,
        })),
        payments: payments.map((p) => ({
          receiptNo: p.receiptNo,
          paidAt: p.paidAt,
          method: p.method,
          amount: p.amount,
          surchargeAmount: p.surchargeAmount,
          reference: p.reference || p.chequeNo || p.bank,
          isVoided: p.isVoided,
        })),
      }),
    );

    const filename = `sardars-mall-booking-${booking.bookingNo}-installment-schedule.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Installment schedule PDF export error:", error);
    return new NextResponse(errorMessage(error), { status: 500 });
  }
}
