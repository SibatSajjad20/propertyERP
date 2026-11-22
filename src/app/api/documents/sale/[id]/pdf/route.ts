import { NextResponse } from "next/server";
import { getSoldDetail } from "@/features/sales/queries";
import { enclosureFromDownPayment } from "@/features/documents/pdf/enclosure";
import { renderFormPdf } from "@/features/documents/pdf/render";
import { effectivePricingArea } from "@/lib/area";
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
    assertCan(session.user.role, "sales.read");

    const { id } = await params;
    const data = await getSoldDetail(id);
    if (!data) return new NextResponse("Not found", { status: 404 });

    const includeAppendix = new URL(request.url).searchParams.get("appendix") !== "0";

    if (data.type === "DIRECT_SALE") {
      const sale = data.data;
      const pdf = await renderFormPdf({
        kind: "sale",
        cacheKey: {
          kind: "sale",
          id: sale.id,
          version: String(new Date(sale.soldAt).getTime()),
        },
        serialNo: sale.serialNo,
        applicationFormNo: sale.applicationFormNo,
        registrationNo: sale.registrationNo,
        documentNo: sale.applicationFormNo,
        date: sale.soldAt,
        printDate: new Date(),
        clientId: sale.clientId,
        includeAppendix,
        unit: {
          unitCode: sale.unitCode,
          floorName: sale.floorName,
          categoryName: sale.categoryName,
          grossAreaSqft: String(
            effectivePricingArea(sale.grossAreaSqft, sale.netAreaSqft),
          ),
          ratePerSqftPkr: String(sale.ratePerSqftPkr),
        },
        client: {
          name: sale.clientName,
          relationPrefix: sale.clientRelationPrefix,
          relationName: sale.clientRelationName,
          cnic: sale.clientCnic,
          phone: sale.clientPhone,
          phoneOffice: sale.clientPhoneOffice ?? "",
          phoneRes: sale.clientPhoneRes ?? "",
          mobile2: sale.clientMobile2 ?? "",
          email: sale.clientEmail ?? "",
          address: sale.homeAddress,
          postalAddress: sale.postalAddress,
          residentialAddress: sale.homeAddress,
        },
        nextOfKin: sale.nextOfKin
          ? {
              name: sale.nextOfKin.name,
              relationPrefix: sale.nextOfKin.relationPrefix,
              relationName: sale.nextOfKin.relationName,
              cnic: sale.nextOfKin.cnic ?? "",
              phone: sale.nextOfKin.phone,
              address: sale.nextOfKin.address ?? "",
              relation: sale.nextOfKin.relation,
            }
          : null,
        payment: {
          netPrice: sale.salePrice,
          downPayment: sale.salePrice,
        },
      });
      return new NextResponse(new Uint8Array(pdf), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${sale.applicationFormNo}-sale-form.pdf"`,
        },
      });
    }

    const booking = data.data.booking;
    const downPayment = [...data.data.payments]
      .filter((p) => !p.isVoided)
      .sort((a, b) => new Date(a.paidAt).getTime() - new Date(b.paidAt).getTime())[0];
    const pdf = await renderFormPdf({
      kind: "sale",
      cacheKey: {
        kind: "sale",
        id: booking.id,
        version: String(new Date(booking.updatedAt ?? booking.createdAt).getTime()),
      },
      serialNo: booking.serialNo,
      applicationFormNo: booking.applicationFormNo,
      registrationNo: booking.registrationNo,
      documentNo: booking.bookingNo,
      date: booking.createdAt,
      printDate: new Date(),
      clientId: booking.clientId,
      includeAppendix,
      unit: {
        unitCode: booking.unitCode,
        floorName: booking.floorName,
        categoryName: booking.categoryName,
        grossAreaSqft: String(
          effectivePricingArea(booking.grossAreaSqft, booking.netAreaSqft),
        ),
        ratePerSqftPkr: String(booking.ratePerSqftPkr),
      },
      client: {
        name: booking.clientName,
        relationPrefix: booking.clientRelationPrefix,
        relationName: booking.clientRelationName,
        cnic: booking.clientCnic,
        phone: booking.clientPhone,
        phoneOffice: booking.clientPhoneOffice ?? "",
        phoneRes: booking.clientPhoneRes ?? "",
        mobile2: booking.clientMobile2 ?? "",
        email: booking.clientEmail ?? "",
        address: booking.homeAddress,
        postalAddress: booking.postalAddress,
        residentialAddress: booking.homeAddress,
      },
      nextOfKin: data.data.nextOfKin
        ? {
            name: data.data.nextOfKin.name,
            relationPrefix: data.data.nextOfKin.relationPrefix,
            relationName: data.data.nextOfKin.relationName,
            cnic: data.data.nextOfKin.cnic ?? "",
            phone: data.data.nextOfKin.phone,
            address: data.data.nextOfKin.address ?? "",
            relation: data.data.nextOfKin.relation,
          }
        : null,
      payment: {
        listPrice: booking.listPrice,
        netPrice: booking.netPrice,
        downPayment: booking.downPayment,
        plan: booking.plan,
        installmentCount: booking.installmentCount,
        balloonTotalAmount: booking.balloonTotalAmount,
        balloonAmountPerYear: booking.balloonAmountPerYear,
        possessionAmount: booking.possessionAmount,
      },
      enclosure: enclosureFromDownPayment(downPayment),
      installments: data.data.installments.map((inst) => ({
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
        "Content-Disposition": `attachment; filename="${booking.applicationFormNo}-sale-form.pdf"`,
      },
    });
  } catch (error) {
    return new NextResponse(errorMessage(error), { status: errorStatus(error) });
  }
}
