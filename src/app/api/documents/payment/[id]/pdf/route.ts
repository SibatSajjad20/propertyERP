import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { eq, or } from "drizzle-orm";
import { db } from "@/db";
import {
  bookings,
  clients,
  floors,
  installments,
  payments,
  units,
  categories,
  user,
  companySettings,
} from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { assertCan } from "@/lib/permissions";
import { errorMessage } from "@/lib/errors";
import {
  PaymentReceiptPdf,
  type PaymentReceiptPdfData,
} from "@/features/installments/pdf/payment-receipt-document";

export const maxDuration = 60;

function isUuid(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession({ redirect: false });
    assertCan(session.user.role, "installments.read");

    const { id } = await context.params;

    // Find payment by UUID id or receiptNo
    const paymentCondition = isUuid(id)
      ? eq(payments.id, id)
      : or(eq(payments.id, id), eq(payments.receiptNo, id));

    const [paymentRow] = await db
      .select({
        id: payments.id,
        receiptNo: payments.receiptNo,
        bookingId: payments.bookingId,
        category: payments.category,
        amount: payments.amount,
        surchargeAmount: payments.surchargeAmount,
        method: payments.method,
        chequeNo: payments.chequeNo,
        bank: payments.bank,
        reference: payments.reference,
        paidAt: payments.paidAt,
        notes: payments.notes,
        isVoided: payments.isVoided,
        receivedByName: user.name,
      })
      .from(payments)
      .leftJoin(user, eq(payments.receivedBy, user.id))
      .where(paymentCondition)
      .limit(1);

    if (!paymentRow) {
      return new NextResponse("Payment receipt not found", { status: 404 });
    }

    // Load booking with unit & client
    const [bookingRow] = await db
      .select({
        id: bookings.id,
        bookingNo: bookings.bookingNo,
        serialNo: bookings.serialNo,
        applicationFormNo: bookings.applicationFormNo,
        registrationNo: bookings.registrationNo,
        netPrice: bookings.netPrice,
        downPayment: bookings.downPayment,
        paidTotal: bookings.paidTotal,
        unitCode: units.unitCode,
        floorName: floors.name,
        categoryName: categories.name,
        clientName: clients.fullName,
        clientCnic: clients.cnic,
        clientPhone: clients.phone,
        clientRelationPrefix: clients.relationPrefix,
        clientRelationName: clients.relationName,
        homeAddress: clients.homeAddress,
      })
      .from(bookings)
      .innerJoin(units, eq(bookings.unitId, units.id))
      .innerJoin(floors, eq(units.floorId, floors.id))
      .leftJoin(categories, eq(units.categoryId, categories.id))
      .innerJoin(clients, eq(bookings.clientId, clients.id))
      .where(eq(bookings.id, paymentRow.bookingId))
      .limit(1);

    if (!bookingRow) {
      return new NextResponse("Associated booking details not found", { status: 404 });
    }

    // Load installments for this booking to calculate exact allocation
    const instRows = await db
      .select({
        id: installments.id,
        seq: installments.seq,
        label: installments.label,
        type: installments.type,
        receiptNos: installments.receiptNos,
      })
      .from(installments)
      .where(eq(installments.bookingId, bookingRow.id));

    const matchedInst = instRows.filter((i) => {
      if (!i.receiptNos) return false;
      const rList = i.receiptNos.split(",").map((s) => s.trim());
      return rList.includes(paymentRow.receiptNo);
    });

    let allocationLabel = "";
    if (matchedInst.length > 0) {
      allocationLabel = matchedInst
        .map((i) => {
          if (i.label) return i.label;
          if (i.type === "BALLOON") return `Balloon #${i.seq}`;
          if (i.type === "POSSESSION") return "Possession";
          return `Installment #${i.seq}`;
        })
        .join(", ");
    } else {
      if (paymentRow.category === "DOWN_PAYMENT") allocationLabel = "Down Payment";
      else if (paymentRow.category === "TOKEN") allocationLabel = "Token / Advance";
      else if (paymentRow.category === "SURCHARGE") allocationLabel = "Late Surcharge";
      else if (paymentRow.category === "BALLOON") allocationLabel = "Balloon Payment";
      else if (paymentRow.category === "POSSESSION") allocationLabel = "Possession";
      else
        allocationLabel = paymentRow.category
          ? paymentRow.category.replaceAll("_", " ")
          : "Down Payment";
    }

    // Company settings
    const [settings] = await db.select().from(companySettings).limit(1);

    const receiptData: PaymentReceiptPdfData = {
      receiptNo: paymentRow.receiptNo,
      paidAt: paymentRow.paidAt,
      amountPkr: paymentRow.amount,
      method: paymentRow.method,
      chequeNo: paymentRow.chequeNo,
      bank: paymentRow.bank,
      reference: paymentRow.reference,
      notes: paymentRow.notes,
      category: paymentRow.category,
      allocationLabel,
      client: {
        fullName: bookingRow.clientName,
        cnic: bookingRow.clientCnic,
        phone: bookingRow.clientPhone,
        relationPrefix: bookingRow.clientRelationPrefix,
        relationName: bookingRow.clientRelationName,
        homeAddress: bookingRow.homeAddress,
      },
      booking: {
        bookingNo: bookingRow.bookingNo,
        serialNo: bookingRow.serialNo,
        applicationFormNo: bookingRow.applicationFormNo,
        registrationNo: bookingRow.registrationNo,
        netPrice: bookingRow.netPrice,
        downPayment: bookingRow.downPayment,
        paidTotal: bookingRow.paidTotal,
      },
      unit: {
        unitCode: bookingRow.unitCode,
        floorName: bookingRow.floorName,
        categoryName: bookingRow.categoryName,
      },
      receivedByName: paymentRow.receivedByName,
      company: {
        name: "Sardar's Mall",
        address: "54-C Iran Road, Block C, near Chandni Chowk, Rawalpindi",
        bankName: settings?.bankName,
        accountTitle: settings?.accountTitle,
        iban: settings?.iban,
      },
    };

    const pdfBuffer = await renderToBuffer(PaymentReceiptPdf({ data: receiptData }));
    const filename = `receipt-${paymentRow.receiptNo}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch (err) {
    return new NextResponse(errorMessage(err), { status: 500 });
  }
}
