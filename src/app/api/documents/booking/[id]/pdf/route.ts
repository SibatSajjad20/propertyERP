import { NextResponse } from "next/server";
import { getBookingDetail } from "@/features/sales/queries";
import { enclosureFromDownPayment } from "@/features/documents/pdf/enclosure";
import { renderFormPdf } from "@/features/documents/pdf/render";
import { effectivePricingArea } from "@/lib/area";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/permissions";

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
  const data = await getBookingDetail(id);
  if (!data) return new NextResponse("Not found", { status: 404 });

  const includeAppendix = new URL(request.url).searchParams.get("appendix") !== "0";
  const downPayment = [...data.payments]
    .filter((p) => !p.isVoided)
    .sort((a, b) => new Date(a.paidAt).getTime() - new Date(b.paidAt).getTime())[0];

  const pdf = await renderFormPdf({
    kind: "booking",
    cacheKey: {
      kind: "booking",
      id: data.booking.id,
      version: String(
        new Date(data.booking.updatedAt ?? data.booking.createdAt).getTime(),
      ),
    },
    serialNo: data.booking.serialNo,
    applicationFormNo: data.booking.applicationFormNo,
    registrationNo: data.booking.registrationNo,
    documentNo: data.booking.bookingNo,
    date: data.booking.createdAt,
    clientId: data.booking.clientId,
    includeAppendix,
    unit: {
      unitCode: data.booking.unitCode,
      floorName: data.booking.floorName,
      categoryName: data.booking.categoryName,
      grossAreaSqft: String(
        effectivePricingArea(data.booking.grossAreaSqft, data.booking.netAreaSqft),
      ),
      ratePerSqftPkr: String(data.booking.ratePerSqftPkr),
    },
    client: {
      name: data.booking.clientName,
      relationPrefix: data.booking.clientRelationPrefix,
      relationName: data.booking.clientRelationName,
      cnic: data.booking.clientCnic,
      phone: data.booking.clientPhone,
      phoneOffice: data.booking.clientPhoneOffice ?? "",
      phoneRes: data.booking.clientPhoneRes ?? "",
      mobile2: data.booking.clientMobile2 ?? "",
      email: data.booking.clientEmail ?? "",
      address: data.booking.homeAddress,
      postalAddress: data.booking.postalAddress,
      residentialAddress: data.booking.homeAddress,
    },
    nextOfKin: data.nextOfKin
      ? {
          name: data.nextOfKin.name,
          relationPrefix: data.nextOfKin.relationPrefix,
          relationName: data.nextOfKin.relationName,
          cnic: data.nextOfKin.cnic ?? "",
          phone: data.nextOfKin.phone,
          address: data.nextOfKin.address ?? "",
          relation: data.nextOfKin.relation,
        }
      : null,
    payment: {
      listPrice: data.booking.listPrice,
      netPrice: data.booking.netPrice,
      discount: data.booking.discountValue,
      downPayment: data.booking.downPayment,
      plan: data.booking.plan,
      installmentCount: data.booking.installmentCount,
    },
    enclosure: enclosureFromDownPayment(downPayment),
    installments: data.installments.map((inst) => ({
      seq: inst.seq,
      dueDate: inst.dueDate,
      amount: inst.amount,
      status: String(inst.status),
    })),
  });

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${data.booking.applicationFormNo}-booking-form.pdf"`,
    },
  });
}
